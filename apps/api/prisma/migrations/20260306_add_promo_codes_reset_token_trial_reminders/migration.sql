-- User: add reset token fields
ALTER TABLE "users" ADD COLUMN "reset_token" TEXT;
ALTER TABLE "users" ADD COLUMN "reset_token_exp" TIMESTAMP(3);
CREATE UNIQUE INDEX "users_reset_token_key" ON "users"("reset_token");

-- Subscription: add trial reminder tracking + promo code relation
ALTER TABLE "subscriptions" ADD COLUMN "trial_reminder_24h_sent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "subscriptions" ADD COLUMN "trial_reminder_48h_sent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "subscriptions" ADD COLUMN "paid_start_email_sent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "subscriptions" ADD COLUMN "promo_code_id" TEXT;

-- PromoCode table
CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "trial_days" INTEGER NOT NULL DEFAULT 30,
    "max_uses" INTEGER NOT NULL DEFAULT 10,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "skip_stripe" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- FK: subscriptions -> promo_codes
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
