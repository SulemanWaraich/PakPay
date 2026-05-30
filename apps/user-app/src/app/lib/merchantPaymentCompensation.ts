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
