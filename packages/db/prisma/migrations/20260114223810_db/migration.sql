/*
  Warnings:

  - Added the required column `name` to the `MerchantProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."MerchantProfile" ADD COLUMN     "name" TEXT NOT NULL;
