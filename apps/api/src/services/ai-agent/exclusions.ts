import { prisma } from '../../lib/prisma.js';
import { generateEmbedding, searchByEmbedding } from '../feedback-ai/embedder.js';
import { config } from '../../config/env.js';

const MAX_EXCLUSION_RULES = 10;

/**
 * Store an embedding vector for an exclusion rule using raw SQL (pgvector).
 */
async function storeRuleEmbedding(ruleId: string, embedding: number[]): Promise<void> {
  const vectorStr = `[${embedding.join(',')}]`;
  await prisma.$executeRawUnsafe(
    `UPDATE "exclusion_rules" SET "embedding" = $1::vector WHERE "id" = $2`,
    vectorStr,
    ruleId,
  );
}

/**
 * Use GPT to confirm which feedbacks truly match the exclusion rule description.
 * Returns the IDs of confirmed matches.
 */
async function confirmMatchesWithGPT(
  ruleDescription: string,
  feedbacks: Array<{ id: string; positiveText: string; negativeText: string | null }>,
): Promise<string[]> {
  if (feedbacks.length === 0) return [];

  const azureEndpoint = config.AZURE_OPENAI_ENDPOINT;
  const azureKey = config.AZURE_OPENAI_API_KEY;
  const deployment = config.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = config.AZURE_OPENAI_API_VERSION;

  if (!azureEndpoint || !azureKey) return feedbacks.map(f => f.id);

  const feedbackList = feedbacks.map((f, i) => {
    let text = `[${i}] POSITIF: "${f.positiveText}"`;
    if (f.negativeText) text += ` | NÉGATIF: "${f.negativeText}"`;
    return text;
  }).join('\n');

  const url = `${azureEndpoint}openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': azureKey },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: `Tu es un assistant qui trie des avis clients. Le manager veut exclure les avis qui correspondent à cette description : "${ruleDescription}".

Analyse chaque avis et retourne UNIQUEMENT les indices (entre crochets) des avis qui correspondent VRAIMENT à cette description.
Réponds en JSON : { "matches": [0, 3, 5] }
Si aucun avis ne correspond, réponds : { "matches": [] }`,
        },
        { role: 'user', content: feedbackList },
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    console.error('GPT confirmation error:', await res.text());
    return [];
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  try {
    const parsed = JSON.parse(data.choices[0].message.content) as { matches: number[] };
    return parsed.matches
      .filter((idx: number) => idx >= 0 && idx < feedbacks.length)
      .map((idx: number) => feedbacks[idx].id);
  } catch {
    return [];
  }
}

/**
 * Check a single feedback against all active exclusion rules for a restaurant.
 * Used in processFeedbackAI for new feedbacks.
 */
export async function checkFeedbackAgainstExclusions(
  feedbackId: string,
  restaurantId: string,
  feedbackEmbedding: number[],
  positiveText: string,
  negativeText: string | null,
): Promise<void> {
  // Get active exclusion rules with embeddings
  const rules = await prisma.$queryRawUnsafe(`
    SELECT id, label, description,
      1 - (embedding <=> $2::vector) as similarity
    FROM exclusion_rules
    WHERE restaurant_id = $1
      AND is_active = true
      AND embedding IS NOT NULL
      AND 1 - (embedding <=> $2::vector) > 0.30
    ORDER BY similarity DESC
  `, restaurantId, `[${feedbackEmbedding.join(',')}]`) as Array<{
    id: string; label: string; description: string; similarity: number;
  }>;

  if (rules.length === 0) return;

  // For each matching rule, confirm with GPT
  const exclusions: Array<{ ruleId: string; ruleLabel: string }> = [];

  for (const rule of rules) {
    const confirmed = await confirmMatchesWithGPT(
      rule.description,
      [{ id: feedbackId, positiveText, negativeText }],
    );
    if (confirmed.includes(feedbackId)) {
      exclusions.push({ ruleId: rule.id, ruleLabel: rule.label });
    }
  }

  if (exclusions.length > 0) {
    await prisma.feedback.update({
      where: { id: feedbackId },
      data: { excludedByRules: exclusions },
    });
    console.log(`Feedback ${feedbackId} excluded by rules: ${exclusions.map(e => e.ruleLabel).join(', ')}`);
  }
}

/**
 * Tool: gerer_exclusions
 * Manages exclusion rules: create, list, deactivate, delete.
 */
export async function gererExclusions(
  restaurantId: string,
  action: 'create' | 'list' | 'deactivate' | 'delete' | 'show_excluded',
  params?: {
    description?: string;
    ruleId?: string;
    ruleName?: string;
  },
): Promise<string> {
  switch (action) {
    case 'list': {
      const rules = await prisma.exclusionRule.findMany({
        where: { restaurantId },
        orderBy: { createdAt: 'desc' },
      });

      if (rules.length === 0) return '📋 Aucune règle d\'exclusion configurée.';

      // Count excluded feedbacks per rule
      const lines: string[] = [];
      for (const r of rules) {
        // Count feedbacks excluded by this specific rule
        const excluded = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*)::int as count FROM feedbacks
          WHERE "restaurantId" = $1
            AND excluded_by_rules @> $2::jsonb
        `, restaurantId, JSON.stringify([{ ruleId: r.id }])) as Array<{ count: number }>;
        const count = excluded[0]?.count || 0;
        const status = r.isActive ? '✅' : '⏸️';
        lines.push(`${status} **${r.label}** — "${r.description}" (${count} avis exclus)`);
      }

      return `📋 ${rules.length} règle(s) d'exclusion :\n\n${lines.join('\n')}`;
    }

    case 'create': {
      if (!params?.description) {
        return '❌ Décrivez le type d\'avis à exclure (ex: "les avis qui disent qu\'on ferme trop tôt le samedi").';
      }

      // Check limit
      const existingCount = await prisma.exclusionRule.count({ where: { restaurantId } });
      if (existingCount >= MAX_EXCLUSION_RULES) {
        return `❌ Limite atteinte (${MAX_EXCLUSION_RULES} règles max). Supprimez une règle existante avant d'en créer une nouvelle.`;
      }

      // Step 1: Generate a short label via GPT
      const label = await generateLabel(params.description);

      // Step 2: Create the rule
      const rule = await prisma.exclusionRule.create({
        data: {
          label,
          description: params.description,
          restaurantId,
        },
      });

      // Step 3: Generate and store embedding for the rule
      const ruleEmbedding = await generateEmbedding(params.description);
      await storeRuleEmbedding(rule.id, ruleEmbedding);

      // Step 4: Scan existing feedbacks with semantic search
      const candidates = await searchByEmbedding(restaurantId, ruleEmbedding, {
        limit: 100,
      });

      let taggedCount = 0;

      if (candidates.length > 0) {
        // Step 5: GPT confirms which ones truly match
        const feedbacksForGPT = candidates.map(c => ({
          id: c.id,
          positiveText: c.positiveText,
          negativeText: c.negativeText,
        }));

        // Process in batches of 20 for GPT
        const batchSize = 20;
        const confirmedIds: string[] = [];

        for (let i = 0; i < feedbacksForGPT.length; i += batchSize) {
          const batch = feedbacksForGPT.slice(i, i + batchSize);
          const batchConfirmed = await confirmMatchesWithGPT(params.description, batch);
          confirmedIds.push(...batchConfirmed);
        }

        // Step 6: Tag confirmed feedbacks
        for (const fbId of confirmedIds) {
          const fb = await prisma.feedback.findUnique({
            where: { id: fbId },
            select: { excludedByRules: true },
          });
          const existing = (fb?.excludedByRules as Array<{ ruleId: string; ruleLabel: string }>) || [];
          if (!existing.some(e => e.ruleId === rule.id)) {
            existing.push({ ruleId: rule.id, ruleLabel: label });
            await prisma.feedback.update({
              where: { id: fbId },
              data: { excludedByRules: existing },
            });
            taggedCount++;
          }
        }
      }

      return `✅ Règle d'exclusion créée : **${label}**\n\n🔍 ${candidates.length} avis analysés → ${taggedCount} avis exclus.\n\nLes futurs avis correspondants seront automatiquement taggés.`;
    }

    case 'deactivate': {
      const rule = await findRule(restaurantId, params?.ruleId, params?.ruleName);
      if (!rule) return '❌ Règle non trouvée. Utilisez "lister les exclusions" pour voir les règles disponibles.';

      const newActive = !rule.isActive;
      await prisma.exclusionRule.update({
        where: { id: rule.id },
        data: { isActive: newActive },
      });

      if (!newActive) {
        // Remove tags from all feedbacks for this rule
        const taggedFeedbacks = await prisma.$queryRawUnsafe(`
          SELECT id, excluded_by_rules FROM feedbacks
          WHERE "restaurantId" = $1
            AND excluded_by_rules @> $2::jsonb
        `, restaurantId, JSON.stringify([{ ruleId: rule.id }])) as Array<{ id: string; excluded_by_rules: Array<{ ruleId: string; ruleLabel: string }> }>;

        for (const fb of taggedFeedbacks) {
          const updated = fb.excluded_by_rules.filter(e => e.ruleId !== rule.id);
          await prisma.feedback.update({
            where: { id: fb.id },
            data: { excludedByRules: updated },
          });
        }

        return `⏸️ Règle "${rule.label}" désactivée. ${taggedFeedbacks.length} avis dé-exclus.`;
      }

      // Reactivate: re-scan and re-tag
      const ruleEmbedding = await generateEmbedding(rule.description);
      const candidates = await searchByEmbedding(restaurantId, ruleEmbedding, { limit: 100 });
      let retagged = 0;

      if (candidates.length > 0) {
        const feedbacksForGPT = candidates.map(c => ({
          id: c.id,
          positiveText: c.positiveText,
          negativeText: c.negativeText,
        }));

        const batchSize = 20;
        const confirmedIds: string[] = [];
        for (let i = 0; i < feedbacksForGPT.length; i += batchSize) {
          const batch = feedbacksForGPT.slice(i, i + batchSize);
          const batchConfirmed = await confirmMatchesWithGPT(rule.description, batch);
          confirmedIds.push(...batchConfirmed);
        }

        for (const fbId of confirmedIds) {
          const fb = await prisma.feedback.findUnique({
            where: { id: fbId },
            select: { excludedByRules: true },
          });
          const existing = (fb?.excludedByRules as Array<{ ruleId: string; ruleLabel: string }>) || [];
          if (!existing.some(e => e.ruleId === rule.id)) {
            existing.push({ ruleId: rule.id, ruleLabel: rule.label });
            await prisma.feedback.update({
              where: { id: fbId },
              data: { excludedByRules: existing },
            });
            retagged++;
          }
        }
      }

      return `✅ Règle "${rule.label}" réactivée. ${retagged} avis re-exclus.`;
    }

    case 'delete': {
      const rule = await findRule(restaurantId, params?.ruleId, params?.ruleName);
      if (!rule) return '❌ Règle non trouvée.';

      // Remove tags from all feedbacks
      const taggedFeedbacks = await prisma.$queryRawUnsafe(`
        SELECT id, excluded_by_rules FROM feedbacks
        WHERE "restaurantId" = $1
          AND excluded_by_rules @> $2::jsonb
      `, restaurantId, JSON.stringify([{ ruleId: rule.id }])) as Array<{ id: string; excluded_by_rules: Array<{ ruleId: string; ruleLabel: string }> }>;

      for (const fb of taggedFeedbacks) {
        const updated = fb.excluded_by_rules.filter(e => e.ruleId !== rule.id);
        await prisma.feedback.update({
          where: { id: fb.id },
          data: { excludedByRules: updated },
        });
      }

      await prisma.exclusionRule.delete({ where: { id: rule.id } });

      return `🗑️ Règle "${rule.label}" supprimée. ${taggedFeedbacks.length} avis dé-exclus.`;
    }

    case 'show_excluded': {
      // Show excluded feedbacks, optionally filtered by rule
      const rule = params?.ruleName || params?.ruleId
        ? await findRule(restaurantId, params?.ruleId, params?.ruleName)
        : null;

      let feedbacks;
      if (rule) {
        feedbacks = await prisma.$queryRawUnsafe(`
          SELECT id, "positiveText", "negativeText", "createdAt", excluded_by_rules
          FROM feedbacks
          WHERE "restaurantId" = $1
            AND excluded_by_rules @> $2::jsonb
          ORDER BY "createdAt" DESC
          LIMIT 30
        `, restaurantId, JSON.stringify([{ ruleId: rule.id }])) as Array<{
          id: string; positiveText: string; negativeText: string | null;
          createdAt: Date; excluded_by_rules: Array<{ ruleId: string; ruleLabel: string }>;
        }>;
      } else {
        feedbacks = await prisma.feedback.findMany({
          where: {
            restaurantId,
            NOT: { excludedByRules: { equals: [] } },
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
        });
      }

      if (feedbacks.length === 0) {
        return rule
          ? `📋 Aucun avis exclu par la règle "${rule.label}".`
          : '📋 Aucun avis exclu.';
      }

      type ExcludedFB = { positiveText: string; negativeText?: string | null; createdAt: Date; excludedByRules?: unknown };
      const lines = (feedbacks as ExcludedFB[]).map((f, i) => {
        const date = new Date(f.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        const rules = (f.excludedByRules as Array<{ ruleLabel: string }>) || [];
        const ruleLabels = rules.map(r => r.ruleLabel).join(', ');
        let text = `${i + 1}. [${date}] [Exclu: ${ruleLabels}]`;
        text += `\n   POSITIF: "${f.positiveText}"`;
        if (f.negativeText) text += `\n   NÉGATIF: "${f.negativeText}"`;
        return text;
      });

      const title = rule ? `pour "${rule.label}"` : 'au total';
      return `📋 ${feedbacks.length} avis exclus ${title} :\n\n${lines.join('\n\n')}`;
    }

    default:
      return '❌ Action non reconnue. Utilisez : create, list, deactivate, delete, show_excluded.';
  }
}

async function findRule(restaurantId: string, ruleId?: string, ruleName?: string) {
  if (ruleId) {
    return prisma.exclusionRule.findFirst({ where: { id: ruleId, restaurantId } });
  }
  if (ruleName) {
    return prisma.exclusionRule.findFirst({
      where: { restaurantId, label: { contains: ruleName, mode: 'insensitive' } },
    });
  }
  return null;
}

async function generateLabel(description: string): Promise<string> {
  const azureEndpoint = config.AZURE_OPENAI_ENDPOINT;
  const azureKey = config.AZURE_OPENAI_API_KEY;
  const deployment = config.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = config.AZURE_OPENAI_API_VERSION;

  if (!azureEndpoint || !azureKey) {
    return description.slice(0, 50);
  }

  try {
    const url = `${azureEndpoint}openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': azureKey },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'Génère un label court (3-6 mots max) pour cette règle d\'exclusion d\'avis clients. Réponds UNIQUEMENT avec le label, sans guillemets ni ponctuation.',
          },
          { role: 'user', content: description },
        ],
        temperature: 0.3,
        max_tokens: 30,
      }),
    });

    if (!res.ok) return description.slice(0, 50);

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0].message.content.trim();
  } catch {
    return description.slice(0, 50);
  }
}
