-- AlterTable OffRampTransaction: structured withdrawal + optional legacy bankAccount
ALTER TABLE "OffRampTransaction" ALTER COLUMN "bankAccount" DROP NOT NULL;
ALTER TABLE "OffRampTransaction" ADD COLUMN "accountHolderName" TEXT;
ALTER TABLE "OffRampTransaction" ADD COLUMN "bankName" TEXT;
ALTER TABLE "OffRampTransaction" ADD COLUMN "accountNumber" TEXT;
ALTER TABLE "OffRampTransaction" ADD COLUMN "branch" TEXT;

UPDATE "OffRampTransaction" SET "bankName" = "bankAccount" WHERE "bankName" IS NULL AND "bankAccount" IS NOT NULL;

-- AlterTable MerchantProfile: KYC document URLs
ALTER TABLE "MerchantProfile" ADD COLUMN "cnicFrontUrl" TEXT;
ALTER TABLE "MerchantProfile" ADD COLUMN "cnicBackUrl" TEXT;
ALTER TABLE "MerchantProfile" ADD COLUMN "proofOfAddressUrl" TEXT;
ALTER TABLE "MerchantProfile" ADD COLUMN "kycSubmittedAt" TIMESTAMP(3);
ALTER TABLE "MerchantProfile" ADD COLUMN "kycReviewNote" TEXT;

-- CreateEnum DisputeStatus
DO $$ BEGIN
  CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'RESOLVED', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable Dispute
CREATE TABLE "Dispute" (
    "id" SERIAL NOT NULL,
    "merchantTransactionId" INTEGER NOT NULL,
    "openedByUserId" INTEGER NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Dispute_merchantTransactionId_key" ON "Dispute"("merchantTransactionId");

ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_merchantTransactionId_fkey" FOREIGN KEY ("merchantTransactionId") REFERENCES "MerchantTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
