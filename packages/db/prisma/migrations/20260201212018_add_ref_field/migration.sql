/*
  Warnings:

  - A unique constraint covering the columns `[ref]` on the table `MerchantTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."MerchantTransaction" ADD COLUMN     "ref" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MerchantTransaction_ref_key" ON "public"."MerchantTransaction"("ref");
