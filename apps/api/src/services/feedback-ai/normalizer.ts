import { config } from '../../config/env.js';

interface NormalizationResult {
  normalizedText: string;
  sentimentScore: number;
  themes: string[];
  severity: 'low' | 'medium' | 'high';
}

/**
 * Normalize a feedback using GPT: reformulate without irony/sarcasm,
 * extract sentiment score, themes, and severity.
 * This normalized version is never shown to the manager — only used for embeddings.
 */
export async function normalizeFeedback(
  positiveText: string,
  negativeText: string | null,
): Promise<NormalizationResult> {
  const azureEndpoint = config.AZURE_OPENAI_ENDPOINT;
  const azureKey = config.AZURE_OPENAI_API_KEY;
  const deployment = config.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = config.AZURE_OPENAI_API_VERSION;

  if (!azureEndpoint || !azureKey) {
    // Fallback: no AI available, return raw text
    const combined = [positiveText, negativeText].filter(Boolean).join(' ');
    return {
      normalizedText: combined,
      sentimentScore: negativeText ? -0.3 : 0.5,
      themes: [],
      severity: negativeText ? 'medium' : 'low',
    };
  }

  const apiUrl = `${azureEndpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const prompt = `Analyse cet avis client de restaurant et retourne un JSON avec exactement ces champs :
- "normalizedText": reformulation claire et neutre de l'avis (sans ironie, sarcasme, argot, emojis). Combine le positif et le négatif en un texte cohérent. Garde le sens exact.
- "sentimentScore": nombre entre -1.0 (très négatif) et 1.0 (très positif). 0 = neutre.
- "themes": tableau de 1 à 5 thèmes parmi : ["attente", "service", "nourriture", "prix", "ambiance", "propreté", "quantité", "température", "accueil", "carte", "boisson", "dessert", "terrasse", "bruit", "décoration", "parking", "réservation", "enfants", "allergènes", "autre"]
- "severity": "low" (remarque mineure), "medium" (problème notable), "high" (problème grave)

Réponds UNIQUEMENT avec le JSON, rien d'autre.

Avis positif : "${positiveText}"
${negativeText ? `Avis négatif : "${negativeText}"` : 'Pas de commentaire négatif.'}`;

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureKey,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'Tu es un assistant qui analyse des avis clients de restaurant. Réponds uniquement en JSON valide.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      console.error('Normalizer API error:', res.status, await res.text());
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    // Parse JSON from response (handle markdown code blocks)
    const jsonStr = content.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(jsonStr) as NormalizationResult;

    return {
      normalizedText: parsed.normalizedText || [positiveText, negativeText].filter(Boolean).join(' '),
      sentimentScore: Math.max(-1, Math.min(1, parsed.sentimentScore || 0)),
      themes: Array.isArray(parsed.themes) ? parsed.themes.slice(0, 5) : [],
      severity: ['low', 'medium', 'high'].includes(parsed.severity) ? parsed.severity : 'medium',
    };
  } catch (err) {
    console.error('Normalizer error:', err);
    const combined = [positiveText, negativeText].filter(Boolean).join(' ');
    return {
      normalizedText: combined,
      sentimentScore: negativeText ? -0.3 : 0.5,
      themes: [],
      severity: negativeText ? 'medium' : 'low',
    };
  }
}
