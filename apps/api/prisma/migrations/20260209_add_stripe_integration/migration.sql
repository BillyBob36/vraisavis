-- AlterTable: Add stripe_customer_id to restaurants
ALTER TABLE "restaurants" ADD COLUMN "stripe_customer_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_stripe_customer_id_key" ON "restaurants"("stripe_customer_id");

-- AlterTable: Add canceledAt to subscriptions
ALTER TABLE "subscriptions" ADD COLUMN "canceledAt" TIMESTAMP(3);

-- AlterTable: Make stripeSubscriptionId unique on subscriptions (drop old non-unique if exists)
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- AlterTable: Remove stripeCustomerId from subscriptions (moved to restaurants)
ALTER TABLE "subscriptions" DROP COLUMN "stripeCustomerId";
