/*
  Warnings:

  - The primary key for the `MerchantTransaction` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "public"."MerchantTransaction" DROP CONSTRAINT "MerchantTransaction_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "MerchantTransaction_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "MerchantTransaction_id_seq";
