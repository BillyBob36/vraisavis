import { config } from '../../config/env.js';
import { consulterAvis, gererLots, stats } from './tools.js';
import { getOrCreateSession, appendToSession } from '../messaging/router.js';

const SYSTEM_PROMPT = `Tu es l'assistant IA du restaurant. Tu aides le manager à :
1. Consulter les avis clients (par jour, semaine, mois)
2. Gérer les lots de la machine à sous (lister, ajouter, modifier, supprimer, stats)
3. Voir les statistiques du restaurant

Règles :
- Réponds toujours en français, de manière concise et professionnelle
- Si le manager demande les avis, utilise la fonction consulter_avis
- Si le manager parle de lots/cadeaux/prix/machine à sous, utilise gerer_lots
- Si le manager demande des chiffres/stats, utilise la fonction stats
- Sois proactif : propose des actions concrètes basées sur les données
- Formate tes réponses pour être lisibles sur mobile (messages courts, emojis)
- Ne révèle jamais de données techniques (IDs, SQL, etc.)`;

const TOOLS_DEFINITION = [
  {
    type: 'function' as const,
    function: {
      name: 'consulter_avis',
      description: 'Consulte les avis clients du restaurant pour une période donnée',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'yesterday', 'week', 'month', 'all'],
            description: 'Période à consulter',
          },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'gerer_lots',
      description: 'Gère les lots de la machine à sous : lister, ajouter, modifier, supprimer, voir les stats',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'add', 'edit', 'remove', 'stats'],
            description: 'Action à effectuer',
          },
          name: { type: 'string', description: 'Nom du lot (pour add/edit/remove)' },
          description: { type: 'string', description: 'Description du lot' },
          probability: { type: 'number', description: 'Probabilité de gain (0 à 1, ex: 0.1 = 10%)' },
          maxPerDay: { type: 'integer', description: 'Nombre max par jour' },
          maxPerWeek: { type: 'integer', description: 'Nombre max par semaine' },
          prizeId: { type: 'string', description: 'ID du lot (pour edit/remove)' },
          isActive: { type: 'boolean', description: 'Activer/désactiver le lot' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'stats',
      description: 'Affiche les statistiques générales du restaurant (avis, visiteurs, lots)',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month', 'all'],
            description: 'Période des stats',
          },
        },
        required: ['period'],
      },
    },
  },
];

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

/**
 * Process a user message through the AI agent.
 * Returns the assistant's response text.
 */
export async function processAgentMessage(
  managerId: string,
  restaurantId: string,
  userMessage: string,
  provider: 'TELEGRAM' | 'WHATSAPP',
): Promise<string> {
  if (!config.AZURE_OPENAI_ENDPOINT || !config.AZURE_OPENAI_API_KEY) {
    return '⚠️ L\'assistant IA n\'est pas encore configuré. Contactez le support.';
  }

  // Get or create session
  const session = await getOrCreateSession(managerId, restaurantId, provider);
  const history = (session.conversationHistory as Array<{ role: string; content: string }>) || [];

  // Build messages array
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-10).map(h => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    let response = await callAzureOpenAI(messages);
    
    // Handle tool calls (may need multiple rounds)
    let maxIterations = 5;
    while (response.tool_calls && response.tool_calls.length > 0 && maxIterations > 0) {
      maxIterations--;
      
      // Add the assistant's response with tool_calls
      messages.push({
        role: 'assistant',
        content: response.content || '',
        tool_calls: response.tool_calls,
      });

      // Execute each tool call
      for (const toolCall of response.tool_calls) {
        const result = await executeTool(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments),
          restaurantId,
        );

        messages.push({
          role: 'tool',
          content: result,
          tool_call_id: toolCall.id,
        });
      }

      // Get the next response
      response = await callAzureOpenAI(messages);
    }

    const assistantText = response.content || 'Désolé, je n\'ai pas pu traiter votre demande.';

    // Save to session history
    await appendToSession(session.id, [
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
      { role: 'assistant', content: assistantText, timestamp: new Date().toISOString() },
    ]);

    return assistantText;
  } catch (err) {
    console.error('Agent error:', err);
    return '❌ Une erreur est survenue. Veuillez réessayer.';
  }
}

async function callAzureOpenAI(messages: ChatMessage[]): Promise<{
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}> {
  const url = `${config.AZURE_OPENAI_ENDPOINT}/openai/deployments/${config.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${config.AZURE_OPENAI_API_VERSION}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.AZURE_OPENAI_API_KEY,
    },
    body: JSON.stringify({
      messages,
      tools: TOOLS_DEFINITION,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Azure OpenAI error:', res.status, errorText);
    throw new Error(`Azure OpenAI error: ${res.status}`);
  }

  const data = await res.json() as {
    choices: Array<{
      message: {
        content: string | null;
        tool_calls?: Array<{
          id: string;
          type: 'function';
          function: { name: string; arguments: string };
        }>;
      };
    }>;
  };

  return data.choices[0].message;
}

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  restaurantId: string,
): Promise<string> {
  try {
    switch (name) {
      case 'consulter_avis':
        return await consulterAvis(restaurantId, (args.period as 'today' | 'yesterday' | 'week' | 'month' | 'all') || 'today');

      case 'gerer_lots':
        return await gererLots(restaurantId, (args.action as 'list' | 'add' | 'edit' | 'remove' | 'stats') || 'list', {
          prizeId: args.prizeId as string | undefined,
          name: args.name as string | undefined,
          description: args.description as string | undefined,
          probability: args.probability as number | undefined,
          maxPerDay: args.maxPerDay as number | undefined,
          maxPerWeek: args.maxPerWeek as number | undefined,
          isActive: args.isActive as boolean | undefined,
        });

      case 'stats':
        return await stats(restaurantId, (args.period as 'today' | 'week' | 'month' | 'all') || 'today');

      default:
        return `Outil "${name}" non reconnu.`;
    }
  } catch (err) {
    console.error(`Tool execution error [${name}]:`, err);
    return `Erreur lors de l'exécution de ${name}.`;
  }
}
