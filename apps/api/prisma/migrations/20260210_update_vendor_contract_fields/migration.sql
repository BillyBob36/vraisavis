-- AlterTable: Add commissionRate to vendors
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 50;

-- AlterTable: Add new fields to vendor_contracts
ALTER TABLE "vendor_contracts" ADD COLUMN IF NOT EXISTS "vendor_phone" TEXT;
ALTER TABLE "vendor_contracts" ADD COLUMN IF NOT EXISTS "vendor_statut" TEXT;
ALTER TABLE "vendor_contracts" ADD COLUMN IF NOT EXISTS "vendor_tva" TEXT;
ALTER TABLE "vendor_contracts" ADD COLUMN IF NOT EXISTS "vendor_tva_number" TEXT;
ALTER TABLE "vendor_contracts" ADD COLUMN IF NOT EXISTS "vendor_city" TEXT;
