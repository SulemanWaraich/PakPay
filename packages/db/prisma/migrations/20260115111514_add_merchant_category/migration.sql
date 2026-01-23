-- CreateEnum
CREATE TYPE "public"."MerchantCategory" AS ENUM ('RETAIL', 'FOOD', 'SERVICES', 'TECH', 'HEALTHCARE', 'EDUCATION');

-- AlterTable
ALTER TABLE "public"."MerchantProfile" ADD COLUMN     "category" "public"."MerchantCategory";
