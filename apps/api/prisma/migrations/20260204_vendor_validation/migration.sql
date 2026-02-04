-- Rendre referralCode optionnel et ajouter champs de validation vendeur
ALTER TABLE "vendors" ALTER COLUMN "referral_code" DROP NOT NULL;
ALTER TABLE "vendors" ADD COLUMN "is_validated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendors" ADD COLUMN "validated_at" TIMESTAMP(3);
