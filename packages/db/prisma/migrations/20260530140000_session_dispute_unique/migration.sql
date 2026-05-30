-- AlterTable
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_transactionId_key" ON "Dispute"("transactionId");
