import type { Prisma } from "@prisma/client";
import prisma from "@repo/db";
import { availableBalancePaisa } from "./balance";
import { logger } from "./logger";

type Tx = Prisma.TransactionClient;

export type FinalizeMerchantPaymentResult =
  | { ok: true }
  | {
      ok: false;
      reason: "txn_not_success" | "lock_mismatch";
      customerId: number;
      ref: string;
      expectedPaisa: number;
      lockedPaisa?: number;
    };

/** Reserve funds for an in-flight off-ramp (same transaction as OffRamp create). */
export async function lockFundsForOffRamp(
  tx: Tx,
  userId: number,
  amountPaisa: number,
): Promise<void> {
  await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${userId} FOR UPDATE`;

  const balance = await tx.balance.findUnique({ where: { userId } });
  if (!balance) {
    throw new Error("NO_BALANCE");
  }
  if (availableBalancePaisa(balance.amount, balance.locked) < amountPaisa) {
    throw new Error("INSUFFICIENT");
  }

  await tx.balance.update({
    where: { userId },
    data: { locked: { increment: amountPaisa } },
  });
}

/** Reserve funds when a merchant payment is PENDING. */
export async function lockFundsForMerchantPayment(
  tx: Tx,
  userId: number,
  amountPaisa: number,
): Promise<void> {
  await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${userId} FOR UPDATE`;

  const balance = await tx.balance.findUnique({ where: { userId } });
  if (!balance) {
    throw new Error("NO_BALANCE");
  }
  if (availableBalancePaisa(balance.amount, balance.locked) < amountPaisa) {
    throw new Error("INSUFFICIENT");
  }

  await tx.balance.update({
    where: { userId },
    data: { locked: { increment: amountPaisa } },
  });
}

/** After merchant payment SUCCESS: move reserved funds out of the wallet. */
export async function finalizeCustomerMerchantPayment(
  customerId: number,
  amountPaisa: number,
  ref: string,
): Promise<FinalizeMerchantPaymentResult> {
  let result: FinalizeMerchantPaymentResult = {
    ok: false,
    reason: "txn_not_success",
    customerId,
    ref,
    expectedPaisa: amountPaisa,
  };

  await prisma.$transaction(async (tx) => {
    const txn = await tx.merchantTransaction.findUnique({ where: { ref } });
    if (!txn || txn.status !== "SUCCESS") {
      return;
    }

    await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${customerId} FOR UPDATE`;

    const balance = await tx.balance.findUnique({ where: { userId: customerId } });
    if (!balance || balance.locked < amountPaisa) {
      const lockedPaisa = balance?.locked ?? 0;
      logger.error(
        "finalizeCustomerMerchantPayment: lock mismatch — leaving lock intact for compensation saga",
        {
          customerId,
          ref,
          expectedPaisa: amountPaisa,
          lockedPaisa,
          transactionId: txn.id,
        },
      );
      result = {
        ok: false,
        reason: "lock_mismatch",
        customerId,
        ref,
        expectedPaisa: amountPaisa,
        lockedPaisa,
      };
      return;
    }

    await tx.balance.update({
      where: { userId: customerId },
      data: {
        amount: { decrement: amountPaisa },
        locked: { decrement: amountPaisa },
      },
    });

    result = { ok: true };
  });

  return result;
}

/** Release reservation when merchant payment fails (idempotent while PENDING). */
export async function releaseMerchantPaymentLock(
  tx: Tx,
  customerId: number,
  amountPaisa: number,
): Promise<void> {
  await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${customerId} FOR UPDATE`;

  const balance = await tx.balance.findUnique({ where: { userId: customerId } });
  if (!balance) {
    return;
  }
  const release = Math.min(balance.locked, amountPaisa);
  if (release <= 0) {
    return;
  }
  await tx.balance.update({
    where: { userId: customerId },
    data: { locked: { decrement: release } },
  });
}
