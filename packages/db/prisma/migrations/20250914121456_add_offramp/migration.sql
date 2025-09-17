-- CreateEnum
CREATE TYPE "public"."OffRampStatus" AS ENUM ('Success', 'Failure', 'Processing');

-- CreateTable
CREATE TABLE "public"."OffRampTransaction" (
    "id" SERIAL NOT NULL,
    "status" "public"."OffRampStatus" NOT NULL,
    "token" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "bankAccount" TEXT NOT NULL,

    CONSTRAINT "OffRampTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OffRampTransaction_token_key" ON "public"."OffRampTransaction"("token");

-- AddForeignKey
ALTER TABLE "public"."OffRampTransaction" ADD CONSTRAINT "OffRampTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
