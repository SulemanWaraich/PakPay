/*
  Warnings:

  - A unique constraint covering the columns `[qrPayload]` on the table `MerchantProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `qrPayload` to the `MerchantProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."MerchantProfile" ADD COLUMN     "qrPayload" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MerchantProfile_qrPayload_key" ON "public"."MerchantProfile"("qrPayload");
