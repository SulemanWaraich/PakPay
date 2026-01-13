/*
  Warnings:

  - You are about to drop the `Merchant` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'MERCHANT');

-- CreateEnum
CREATE TYPE "public"."KycStatus" AS ENUM ('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'USER';

-- DropTable
DROP TABLE "public"."Merchant";

-- CreateTable
CREATE TABLE "public"."MerchantProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "businessName" TEXT,
    "kycStatus" "public"."KycStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantProfile_userId_key" ON "public"."MerchantProfile"("userId");

-- AddForeignKey
ALTER TABLE "public"."MerchantProfile" ADD CONSTRAINT "MerchantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
