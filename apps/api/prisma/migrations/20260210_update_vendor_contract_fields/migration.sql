-- AlterTable: Add commissionRate to vendors
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 50;

-- AlterTable: Add new fields to vendor_contracts
ALTER TABLE "vendor_contracts" ADD COLUMN IF NOT EXISTS "vendorPhone" TEXT;
ALTER TABLE "vendor_contracts" ADD COLUMN IF NOT EXISTS "vendorStatut" TEXT;
ALTER TABLE "vendor_contracts" ADD COLUMN IF NOT EXISTS "vendorTVA" TEXT;
ALTER TABLE "vendor_contracts" ADD COLUMN IF NOT EXISTS "vendorTVANumber" TEXT;
ALTER TABLE "vendor_contracts" ADD COLUMN IF NOT EXISTS "vendorCity" TEXT;
