import { prisma } from '../../lib/prisma.js';
import { normalizeFeedback } from './normalizer.js';
import { generateEmbedding, storeEmbedding } from './embedder.js';

/**
 * Process a newly created feedback: normalize with GPT + generate embedding.
 * Runs asynchronously (fire-and-forget) so it doesn't block the client response.
 */
export async function processFeedbackAI(feedbackId: string): Promise<void> {
  try {
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: { id: true, positiveText: true, negativeText: true },
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
    try {
      const embedding = await generateEmbedding(normalized.normalizedText);
      await storeEmbedding(feedbackId, embedding);
    } catch (embErr) {
      console.error(`Embedding failed for feedback ${feedbackId}:`, embErr);
      // Normalization is saved even if embedding fails
    }

    console.log(`AI processed feedback ${feedbackId}: sentiment=${normalized.sentimentScore}, themes=${normalized.themes.join(',')}`);
  } catch (err) {
    console.error(`Failed to AI-process feedback ${feedbackId}:`, err);
  }
}

/**
 * Backfill: process all feedbacks that don't have normalizedText yet.
 * Processes in batches to avoid overwhelming the API.
 */
export async function backfillFeedbacks(restaurantId?: string): Promise<{ processed: number; errors: number }> {
  const where: Record<string, unknown> = { normalizedText: null };
  if (restaurantId) where.restaurantId = restaurantId;

  const feedbacks = await prisma.feedback.findMany({
    where,
    select: { id: true, positiveText: true, negativeText: true },
    orderBy: { createdAt: 'desc' },
    take: 200, // Process in batches of 200
  });

  let processed = 0;
  let errors = 0;

  for (const fb of feedbacks) {
    try {
      await processFeedbackAI(fb.id);
      processed++;
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch {
      errors++;
    }
  }

  return { processed, errors };
}
