import { config } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate an embedding vector for the given text using Azure OpenAI.
 * Returns a float array of 1536 dimensions.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const azureEndpoint = config.AZURE_OPENAI_ENDPOINT;
  const azureKey = config.AZURE_OPENAI_API_KEY;
  const apiVersion = config.AZURE_OPENAI_API_VERSION;

  if (!azureEndpoint || !azureKey) {
    throw new Error('Azure OpenAI not configured');
  }

  // Azure OpenAI embeddings endpoint
  const apiUrl = `${azureEndpoint.replace(/\/$/, '')}/openai/deployments/${EMBEDDING_MODEL}/embeddings?api-version=${apiVersion}`;

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': azureKey,
    },
    body: JSON.stringify({
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Embedding API error:', res.status, errText);
    throw new Error(`Embedding API error: ${res.status}`);
  }

  const data = await res.json() as {
    data: Array<{ embedding: number[] }>;
  };

  return data.data[0].embedding;
}

/**
 * Store an embedding vector for a feedback using raw SQL (pgvector).
 */
export async function storeEmbedding(feedbackId: string, embedding: number[]): Promise<void> {
  const vectorStr = `[${embedding.join(',')}]`;
  await prisma.$executeRawUnsafe(
    `UPDATE "feedbacks" SET "embedding" = $1::vector WHERE "id" = $2`,
    vectorStr,
    feedbackId,
  );
}

/**
 * Search feedbacks by semantic similarity to a query text.
 * Returns the top N most similar feedbacks.
 */
export async function searchByEmbedding(
  restaurantId: string,
  queryEmbedding: number[],
  options: {
    limit?: number;
    sentiment?: 'positive' | 'negative' | 'all';
    dateFrom?: Date;
    dateTo?: Date;
    serviceType?: string;
  } = {},
): Promise<Array<{
  id: string;
  positiveText: string;
  negativeText: string | null;
  normalizedText: string | null;
  sentimentScore: number | null;
  themes: unknown;
  severity: string | null;
  serviceType: string;
  createdAt: Date;
  similarity: number;
}>> {
  const limit = options.limit || 30;
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  // Build WHERE conditions
  const conditions: string[] = [`f."restaurantId" = $1`, `f."embedding" IS NOT NULL`];
  const params: unknown[] = [restaurantId];
  let paramIdx = 2;

  if (options.sentiment === 'negative') {
    conditions.push(`f."negativeText" IS NOT NULL AND f."negativeText" != ''`);
  } else if (options.sentiment === 'positive') {
    conditions.push(`(f."negativeText" IS NULL OR f."negativeText" = '')`);
  }

  if (options.dateFrom) {
    conditions.push(`f."createdAt" >= $${paramIdx}`);
    params.push(options.dateFrom);
    paramIdx++;
  }

  if (options.dateTo) {
    conditions.push(`f."createdAt" < $${paramIdx}`);
    params.push(options.dateTo);
    paramIdx++;
  }

  if (options.serviceType) {
    conditions.push(`f."serviceType" = $${paramIdx}`);
    params.push(options.serviceType);
    paramIdx++;
  }

  const whereClause = conditions.join(' AND ');

  const query = `
    SELECT
      f."id",
      f."positiveText",
      f."negativeText",
      f."normalized_text" as "normalizedText",
      f."sentiment_score" as "sentimentScore",
      f."themes",
      f."severity",
      f."serviceType",
      f."createdAt",
      1 - (f."embedding" <=> $${paramIdx}::vector) as "similarity"
    FROM "feedbacks" f
    WHERE ${whereClause}
    ORDER BY f."embedding" <=> $${paramIdx}::vector
    LIMIT ${limit}
  `;
  params.push(vectorStr);

  const results = await prisma.$queryRawUnsafe(query, ...params) as Array<{
    id: string;
    positiveText: string;
    negativeText: string | null;
    normalizedText: string | null;
    sentimentScore: number | null;
    themes: unknown;
    severity: string | null;
    serviceType: string;
    createdAt: Date;
    similarity: number;
  }>;

  return results;
}

/**
 * Get aggregated theme counts for a period.
 */
export async function getThemeCounts(
  restaurantId: string,
  dateFrom: Date,
  dateTo: Date,
  sentiment?: 'positive' | 'negative' | 'all',
): Promise<Record<string, number>> {
  let sentimentFilter = '';
  if (sentiment === 'negative') {
    sentimentFilter = `AND f."negativeText" IS NOT NULL AND f."negativeText" != ''`;
  } else if (sentiment === 'positive') {
    sentimentFilter = `AND (f."negativeText" IS NULL OR f."negativeText" = '')`;
  }

  const results = await prisma.$queryRawUnsafe(`
    SELECT theme, COUNT(*)::int as count
    FROM "feedbacks" f,
    jsonb_array_elements_text(f."themes") AS theme
    WHERE f."restaurantId" = $1
      AND f."createdAt" >= $2
      AND f."createdAt" < $3
      ${sentimentFilter}
    GROUP BY theme
    ORDER BY count DESC
  `, restaurantId, dateFrom, dateTo) as Array<{ theme: string; count: number }>;

  const counts: Record<string, number> = {};
  for (const r of results) {
    counts[r.theme] = r.count;
  }
  return counts;
}
