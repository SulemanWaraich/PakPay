/*
  Warnings:

  - You are about to drop the column `provider` on the `OffRampTransaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."OffRampTransaction" DROP COLUMN "provider";
