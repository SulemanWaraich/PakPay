import prisma from "@repo/db";
import { releaseMerchantPaymentLock } from "./balanceLocks";
import { logger } from "./logger";

export type CompensateFinalizeResult =
  | { outcome: "COMPENSATION_SUCCESS" }
  | { outcome: "COMPENSATION_FAILED_MANUAL_REVIEW" }
  | { outcome: "SKIPPED" };

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
 *
 * Saga: merchant credit is reversed first (balance may go negative); customer lock is only
 * released after a successful merchant debit so both sides cannot remain funded.
 */
export async function compensateFinalizeFailureAfterSuccess(
  ref: string,
  customerId: number,
  merchantUserId: number,
  amountPaisa: number,
): Promise<CompensateFinalizeResult> {
  const [lockFirst, lockSecond] =
    customerId < merchantUserId
      ? [customerId, merchantUserId]
      : [merchantUserId, customerId];

  try {
    return await prisma.$transaction(async (tx) => {
      const txn = await tx.merchantTransaction.findUnique({ where: { ref } });
      if (!txn || txn.status !== "SUCCESS") {
        return { outcome: "SKIPPED" as const };
      }

      await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${lockFirst} FOR UPDATE`;
      await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${lockSecond} FOR UPDATE`;

      const merchantBalance = await tx.balance.findUnique({
        where: { userId: merchantUserId },
      });

      if (!merchantBalance) {
        await tx.merchantTransaction.update({
          where: { ref },
          data: { status: "COMPENSATION_PENDING" },
        });
        await tx.auditLog.create({
          data: {
            merchantId: txn.merchantId,
            action: "COMPENSATION_FAILED_MANUAL_REVIEW",
            reason: `ref=${ref} merchant balance row missing`,
            performedBy: customerId,
          },
        });
        return { outcome: "COMPENSATION_FAILED_MANUAL_REVIEW" as const };
      }

      try {
        await tx.balance.update({
          where: { userId: merchantUserId },
          data: { amount: { decrement: amountPaisa } },
        });
      } catch (debitError) {
        logger.error("compensateFinalizeFailureAfterSuccess: merchant debit failed", {
          ref,
          merchantUserId,
          amountPaisa,
          error: String(debitError),
        });
        await tx.merchantTransaction.update({
          where: { ref },
          data: { status: "COMPENSATION_PENDING" },
        });
        await tx.auditLog.create({
          data: {
            merchantId: txn.merchantId,
            action: "COMPENSATION_FAILED_MANUAL_REVIEW",
            reason: `ref=${ref} merchant debit failed`,
            performedBy: customerId,
          },
        });
        return { outcome: "COMPENSATION_FAILED_MANUAL_REVIEW" as const };
      }

      await releaseMerchantPaymentLock(tx, customerId, amountPaisa);

      await tx.merchantTransaction.update({
        where: { ref },
        data: { status: "FAILED" },
      });

      await tx.auditLog.create({
        data: {
          merchantId: txn.merchantId,
          action: "COMPENSATION_SUCCESS",
          reason: `ref=${ref} amountPaisa=${amountPaisa}`,
          performedBy: customerId,
        },
      });

      return { outcome: "COMPENSATION_SUCCESS" as const };
    });
  } catch (error) {
    logger.error("compensateFinalizeFailureAfterSuccess: transaction failed", {
      ref,
      customerId,
      merchantUserId,
      error: String(error),
    });
    return { outcome: "COMPENSATION_FAILED_MANUAL_REVIEW" };
  }
}
