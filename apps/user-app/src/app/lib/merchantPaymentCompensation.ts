import prisma from "@repo/db";

/**
 * Idempotent: only refunds customer and marks FAILED while txn is still PENDING.
 * Used when merchant webhook fails after the customer was debited in /api/pay.
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

    await tx.balance.update({
      where: { userId: customerId },
      data: { amount: { increment: amountPaisa } },
    });

    await tx.merchantTransaction.update({
      where: { ref },
      data: { status: "FAILED" },
    });
  });
}
