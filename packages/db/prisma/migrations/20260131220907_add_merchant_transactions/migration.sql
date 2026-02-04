-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('QR', 'CARD', 'WALLET', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- CreateTable
CREATE TABLE "public"."MerchantTransaction" (
    "id" SERIAL NOT NULL,
    "merchantId" INTEGER NOT NULL,
    "customerId" INTEGER,
    "amount" INTEGER NOT NULL,
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL,
    "settled" BOOLEAN NOT NULL DEFAULT false,
    "settledAt" TIMESTAMP(3),
    "refunded" BOOLEAN NOT NULL DEFAULT false,
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."MerchantTransaction" ADD CONSTRAINT "MerchantTransaction_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "public"."MerchantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MerchantTransaction" ADD CONSTRAINT "MerchantTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
