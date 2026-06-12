/*
  Warnings:

  - You are about to drop the column `evidenceUrl` on the `Dispute` table. All the data in the column will be lost.
  - You are about to drop the column `cnicBackPublicId` on the `MerchantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `cnicFrontPublicId` on the `MerchantProfile` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Dispute" DROP CONSTRAINT "Dispute_merchantTransactionId_fkey";

-- AlterTable
ALTER TABLE "public"."Dispute" DROP COLUMN "evidenceUrl",
ALTER COLUMN "resolvedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."MerchantProfile" DROP COLUMN "cnicBackPublicId",
DROP COLUMN "cnicFrontPublicId";

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'PENDING';

-- RenameForeignKey
ALTER TABLE "public"."Dispute" RENAME CONSTRAINT "Dispute_openedByUserId_fkey" TO "Dispute_userId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Dispute" ADD CONSTRAINT "Dispute_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."MerchantTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."Dispute_merchantTransactionId_key" RENAME TO "Dispute_transactionId_key";
