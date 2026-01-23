/*
  Warnings:

  - You are about to drop the column `name` on the `MerchantProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."MerchantProfile" DROP COLUMN "name",
ADD COLUMN     "ownerName" TEXT,
ALTER COLUMN "qrPayload" DROP NOT NULL;
