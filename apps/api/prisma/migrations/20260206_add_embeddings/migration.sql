-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add AI-enriched columns to feedbacks
ALTER TABLE "feedbacks" ADD COLUMN "normalized_text" TEXT;
ALTER TABLE "feedbacks" ADD COLUMN "sentiment_score" DOUBLE PRECISION;
ALTER TABLE "feedbacks" ADD COLUMN "themes" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "feedbacks" ADD COLUMN "severity" TEXT;

-- Add embedding column (1536 dimensions for text-embedding-3-small)
ALTER TABLE "feedbacks" ADD COLUMN "embedding" vector(1536);

-- Create HNSW index for fast similarity search
CREATE INDEX "feedbacks_embedding_idx" ON "feedbacks" USING hnsw ("embedding" vector_cosine_ops);
