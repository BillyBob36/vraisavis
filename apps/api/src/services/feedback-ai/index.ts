import { prisma } from '../../lib/prisma.js';
import { normalizeFeedback } from './normalizer.js';
import { generateEmbedding, storeEmbedding } from './embedder.js';
import { checkFeedbackAgainstExclusions } from '../ai-agent/exclusions.js';

/**
 * Process a newly created feedback: normalize with GPT + generate embedding.
 * Runs asynchronously (fire-and-forget) so it doesn't block the client response.
 */
export async function processFeedbackAI(feedbackId: string): Promise<void> {
  try {
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: { id: true, positiveText: true, negativeText: true, restaurantId: true },
    });

    if (!feedback) return;

    // Step 1: Normalize with GPT
    const normalized = await normalizeFeedback(feedback.positiveText, feedback.negativeText);

    // Step 2: Save normalized data to DB
    await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        normalizedText: normalized.normalizedText,
        sentimentScore: normalized.sentimentScore,
        themes: normalized.themes,
        severity: normalized.severity,
      },
    });

    // Step 3: Generate embedding on the normalized text
    let feedbackEmbedding: number[] | null = null;
    try {
      feedbackEmbedding = await generateEmbedding(normalized.normalizedText);
      await storeEmbedding(feedbackId, feedbackEmbedding);
    } catch (embErr) {
      console.error(`Embedding failed for feedback ${feedbackId}:`, embErr);
      // Normalization is saved even if embedding fails
    }

    // Step 4: Check against exclusion rules
    if (feedbackEmbedding) {
      try {
        await checkFeedbackAgainstExclusions(
          feedbackId,
          feedback.restaurantId,
          feedbackEmbedding,
          feedback.positiveText,
          feedback.negativeText,
        );
      } catch (exclErr) {
        console.error(`Exclusion check failed for feedback ${feedbackId}:`, exclErr);
      }
    }

    console.log(`AI processed feedback ${feedbackId}: sentiment=${normalized.sentimentScore}, themes=${normalized.themes.join(',')}`);
  } catch (err) {
    console.error(`Failed to AI-process feedback ${feedbackId}:`, err);
  }
}

// Simple keyword-based theme extraction for backfill (no GPT needed)
const THEME_KEYWORDS: Record<string, string[]> = {
  attente: ['attente', 'attendre', 'long', 'lent', 'rapide', 'temps'],
  service: ['service', 'serveur', 'serveuse', 'personnel', 'staff', 'accueil'],
  nourriture: ['plat', 'cuisine', 'nourriture', 'goût', 'saveur', 'recette', 'cuisson', 'cuit', 'frais', 'fade'],
  prix: ['prix', 'cher', 'coût', 'tarif', 'rapport qualité', 'addition', 'facture'],
  ambiance: ['ambiance', 'atmosphère', 'musique', 'décor', 'cadre', 'agréable'],
  propreté: ['propre', 'propreté', 'sale', 'hygiène', 'nettoyage'],
  quantité: ['quantité', 'portion', 'copieux', 'généreux', 'petit', 'insuffisant'],
  température: ['froid', 'chaud', 'tiède', 'température', 'brûlant'],
  accueil: ['accueil', 'bienvenue', 'sourire', 'aimable', 'sympathique', 'chaleureux'],
  carte: ['carte', 'menu', 'choix', 'variété', 'option', 'végétarien'],
  boisson: ['boisson', 'vin', 'bière', 'cocktail', 'café', 'thé', 'eau'],
  dessert: ['dessert', 'gâteau', 'tarte', 'glace', 'sucré', 'pâtisserie'],
  terrasse: ['terrasse', 'extérieur', 'dehors', 'jardin'],
  bruit: ['bruit', 'bruyant', 'calme', 'sonore', 'fort'],
};

function extractThemesFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      found.push(theme);
    }
  }
  return found.length > 0 ? found : ['autre'];
}

function estimateSentiment(positiveText: string, negativeText: string | null): number {
  if (!negativeText || negativeText.trim() === '') return 0.7;
  const posLen = positiveText.length;
  const negLen = negativeText.length;
  // More negative text = lower score
  const ratio = posLen / (posLen + negLen);
  return parseFloat((ratio * 1.4 - 0.2).toFixed(2)); // maps ~0.5 ratio to ~0.5 score
}

/**
 * Backfill: process all feedbacks that don't have normalizedText yet.
 * For existing AI-generated feedbacks: copies text as-is, extracts themes by keywords, generates embeddings.
 * Processes in batches to avoid overwhelming the embedding API.
 */
export async function backfillFeedbacks(restaurantId?: string): Promise<{ processed: number; errors: number }> {
  const where: Record<string, unknown> = { normalizedText: null };
  if (restaurantId) where.restaurantId = restaurantId;

  const total = await prisma.feedback.count({ where });
  console.log(`Backfill: ${total} feedbacks to process`);

  let processed = 0;
  let errors = 0;
  let skip = 0;
  const batchSize = 50;

  while (skip < total) {
    const feedbacks = await prisma.feedback.findMany({
      where,
      select: { id: true, positiveText: true, negativeText: true },
      orderBy: { createdAt: 'desc' },
      take: batchSize,
    });

    if (feedbacks.length === 0) break;

    for (const fb of feedbacks) {
      try {
        // Combine texts as normalizedText (already AI-generated, no reformulation needed)
        const combined = fb.negativeText
          ? `${fb.positiveText} ${fb.negativeText}`
          : fb.positiveText;

        const themes = extractThemesFromText(combined);
        const sentimentScore = estimateSentiment(fb.positiveText, fb.negativeText);
        const severity = !fb.negativeText || fb.negativeText.trim() === '' ? 'low'
          : sentimentScore < 0 ? 'high' : sentimentScore < 0.3 ? 'medium' : 'low';

        // Save normalized data
        await prisma.feedback.update({
          where: { id: fb.id },
          data: {
            normalizedText: combined,
            sentimentScore,
            themes,
            severity,
          },
        });

        // Generate and store embedding
        try {
          const embedding = await generateEmbedding(combined);
          await storeEmbedding(fb.id, embedding);
        } catch (embErr) {
          console.error(`Embedding failed for ${fb.id}:`, embErr);
        }

        processed++;
        // Small delay to respect rate limits (1500 req/min = ~25/s)
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (err) {
        console.error(`Backfill error for ${fb.id}:`, err);
        errors++;
      }
    }

    skip += feedbacks.length;
    console.log(`Backfill progress: ${processed}/${total} processed, ${errors} errors`);
  }

  console.log(`Backfill complete: ${processed} processed, ${errors} errors`);
  return { processed, errors };
}
