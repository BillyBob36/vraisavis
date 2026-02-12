-- CreateTable
CREATE TABLE "exclusion_rules" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "restaurant_id" TEXT NOT NULL,

    CONSTRAINT "exclusion_rules_pkey" PRIMARY KEY ("id")
);

-- Add embedding column (pgvector)
ALTER TABLE "exclusion_rules" ADD COLUMN "embedding" vector(1536);

-- Add excluded_by_rules to feedbacks
ALTER TABLE "feedbacks" ADD COLUMN "excluded_by_rules" JSONB NOT NULL DEFAULT '[]';

-- AddForeignKey
ALTER TABLE "exclusion_rules" ADD CONSTRAINT "exclusion_rules_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Index for fast lookup by restaurant
CREATE INDEX "exclusion_rules_restaurant_id_idx" ON "exclusion_rules"("restaurant_id");

-- HNSW index for embedding similarity search
CREATE INDEX "exclusion_rules_embedding_idx" ON "exclusion_rules" USING hnsw ("embedding" vector_cosine_ops);

-- Add WEB to MessagingProvider enum
ALTER TYPE "MessagingProvider" ADD VALUE IF NOT EXISTS 'WEB';
