-- CreateEnum
CREATE TYPE "MessagingProvider" AS ENUM ('TELEGRAM', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "SummaryPeriodType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable: Add messaging fields to users
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
ALTER TABLE "users" ADD COLUMN "preferred_messaging" "MessagingProvider";
ALTER TABLE "users" ADD COLUMN "telegram_chat_id" TEXT;
ALTER TABLE "users" ADD COLUMN "whatsapp_number" TEXT;
ALTER TABLE "users" ADD COLUMN "whatsapp_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "messaging_opt_in" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_chat_id_key" ON "users"("telegram_chat_id");

-- CreateTable
CREATE TABLE "feedback_summaries" (
    "id" TEXT NOT NULL,
    "period_type" "SummaryPeriodType" NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "total_feedbacks" INTEGER NOT NULL DEFAULT 0,
    "avg_sentiment" DOUBLE PRECISION,
    "positive_summary" TEXT,
    "negative_summary" TEXT,
    "top_strengths" JSONB,
    "top_weaknesses" JSONB,
    "action_items" JSONB,
    "raw_analysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "restaurant_id" TEXT NOT NULL,

    CONSTRAINT "feedback_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedback_summaries_restaurant_id_period_type_period_start_idx" ON "feedback_summaries"("restaurant_id", "period_type", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_summaries_restaurant_id_period_type_period_start_key" ON "feedback_summaries"("restaurant_id", "period_type", "period_start");

-- AddForeignKey
ALTER TABLE "feedback_summaries" ADD CONSTRAINT "feedback_summaries_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "messaging_sessions" (
    "id" TEXT NOT NULL,
    "provider" "MessagingProvider" NOT NULL,
    "conversation_history" JSONB NOT NULL DEFAULT '[]',
    "last_message_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "manager_id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,

    CONSTRAINT "messaging_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "messaging_sessions_manager_id_restaurant_id_provider_key" ON "messaging_sessions"("manager_id", "restaurant_id", "provider");

-- AddForeignKey
ALTER TABLE "messaging_sessions" ADD CONSTRAINT "messaging_sessions_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "messaging_verifications" (
    "id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "manager_id" TEXT NOT NULL,

    CONSTRAINT "messaging_verifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "messaging_verifications" ADD CONSTRAINT "messaging_verifications_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
