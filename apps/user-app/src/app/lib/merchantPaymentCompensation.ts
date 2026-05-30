import prisma from "@repo/db";
import { releaseMerchantPaymentLock } from "./balanceLocks";

/**
 * Idempotent: only releases lock and marks FAILED while txn is still PENDING.
 * Used when merchant webhook fails after funds were reserved in /api/pay.
 */
export async function compensateFailedMerchantPayment(
  ref: string,
  customerId: number,
  amountPaisa: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const txn = await tx.merchantTransaction.findUnique({ where: { ref } });
    if (!txn || txn.status !== "PENDING") {
      return;
    }

    await releaseMerchantPaymentLock(tx, customerId, amountPaisa);

    await tx.merchantTransaction.update({
      where: { ref },
      data: { status: "FAILED" },
    });
  });
}

/**
 * Reverses a SUCCESS merchant payment when finalize fails (merchant credited, customer not debited).
 */
export async function compensateFinalizeFailureAfterSuccess(
  ref: string,
  customerId: number,
  merchantUserId: number,
  amountPaisa: number,
): Promise<void> {
  const [lockFirst, lockSecond] =
    customerId < merchantUserId
      ? [customerId, merchantUserId]
      : [merchantUserId, customerId];

  await prisma.$transaction(async (tx) => {
    const txn = await tx.merchantTransaction.findUnique({ where: { ref } });
    if (!txn || txn.status !== "SUCCESS") {
      return;
    }

    await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${lockFirst} FOR UPDATE`;
    await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${lockSecond} FOR UPDATE`;

    await releaseMerchantPaymentLock(tx, customerId, amountPaisa);

    const merchantBalance = await tx.balance.findUnique({
      where: { userId: merchantUserId },
    });
    if (merchantBalance && merchantBalance.amount >= amountPaisa) {
      await tx.balance.update({
        where: { userId: merchantUserId },
        data: { amount: { decrement: amountPaisa } },
      });
    }

    await tx.merchantTransaction.update({
      where: { ref },
      data: { status: "FAILED" },
    });
  });
}
