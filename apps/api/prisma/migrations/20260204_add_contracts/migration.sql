-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CGU_CGV', 'VENDOR_CONTRACT');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'SENT', 'SIGNED', 'REJECTED');

-- CreateTable
CREATE TABLE "contract_templates" (
    "id" TEXT NOT NULL,
    "type" "ContractType" NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "companyName" TEXT NOT NULL,
    "companyLegalForm" TEXT NOT NULL,
    "companyCapital" TEXT NOT NULL,
    "companyAddress" TEXT NOT NULL,
    "companyRCS" TEXT NOT NULL,
    "companySIRET" TEXT NOT NULL,
    "companyVAT" TEXT NOT NULL,
    "companyPhone" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "companyDirector" TEXT NOT NULL,
    "hostingProvider" TEXT NOT NULL,
    "hostingAddress" TEXT NOT NULL,
    "dpoEmail" TEXT,
    "mediatorName" TEXT NOT NULL,
    "mediatorAddress" TEXT NOT NULL,
    "mediatorWebsite" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "monthlyPrice" INTEGER,
    "commissionRate" DOUBLE PRECISION,
    "commissionDuration" INTEGER,
    "contractContent" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_contracts" (
    "id" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "signedAt" TIMESTAMP(3),
    "signatureIP" TEXT,
    "signatureData" TEXT,
    "vendorName" TEXT NOT NULL,
    "vendorEmail" TEXT NOT NULL,
    "vendorAddress" TEXT,
    "vendorSIRET" TEXT,
    "vendorIBAN" TEXT,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "vendor_contracts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vendor_contracts" ADD CONSTRAINT "vendor_contracts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_contracts" ADD CONSTRAINT "vendor_contracts_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "contract_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
