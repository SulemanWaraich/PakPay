-- CreateEnum
CREATE TYPE "public"."SettlementStatus" AS ENUM ('PROCESSING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "public"."MerchantTransaction" ADD COLUMN     "settlementId" INTEGER;

-- DropEnum
DROP TYPE "public"."AuthType";

-- CreateTable
CREATE TABLE "public"."Settlement" (
    "id" SERIAL NOT NULL,
    "merchantId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "public"."SettlementStatus" NOT NULL DEFAULT 'PROCESSING',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SettlementLock" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),

    CONSTRAINT "SettlementLock_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."MerchantTransaction" ADD CONSTRAINT "MerchantTransaction_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "public"."Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Settlement" ADD CONSTRAINT "Settlement_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "public"."MerchantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
