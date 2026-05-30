import { NextResponse } from "next/server";
import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { rateLimitAllow } from "../../../lib/rateLimitRedis";
import { z } from "zod";

const bodySchema = z.object({
  disputeId: z.number().int().positive(),
  action: z.enum(["REFUND", "REJECT"]),
  note: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminId = Number(session.user.id);

  if (!(await rateLimitAllow(`rl:admin:disputes:${adminId}`, 10, 60))) {
    return NextResponse.json(
      { success: false, message: "Too many requests" },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { disputeId, action, note } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: { MerchantTransaction: true },
      });
      if (!dispute) {
        throw new Error("NOT_FOUND");
      }
      if (
        dispute.status === "RESOLVED" ||
        dispute.status === "REJECTED"
      ) {
        throw new Error("ALREADY_RESOLVED");
      }

      const m = dispute.MerchantTransaction;
      if (!m.customerId) {
        throw new Error("NO_CUSTOMER");
      }

      if (action === "REJECT") {
        await tx.dispute.update({
          where: { id: disputeId },
          data: {
            status: "REJECTED",
            adminNotes: note ?? null,
          },
        });
        await tx.auditLog.create({
          data: {
            merchantId: m.merchantId,
            action: "DISPUTE_REJECT",
            reason: note ?? null,
            performedBy: adminId,
          },
        });
        return;
      }

      // REFUND
      if (m.refunded) {
        throw new Error("ALREADY_REFUNDED");
      }

      const profile = await tx.merchantProfile.findUnique({
        where: { id: m.merchantId },
        select: { userId: true },
      });
      if (!profile) {
        throw new Error("NO_MERCHANT");
      }

      const customerId = m.customerId;
      const merchantUserId = profile.userId;
      const refundAmount = m.amount;
      const [lockFirst, lockSecond] =
        customerId < merchantUserId
          ? [customerId, merchantUserId]
          : [merchantUserId, customerId];

      await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${lockFirst} FOR UPDATE`;
      await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${lockSecond} FOR UPDATE`;

      const merchantBalance = await tx.balance.findUnique({
        where: { userId: merchantUserId },
      });

      // OPTION A (strict): refuse refunds that would drive merchant gross balance negative.
      if (!merchantBalance || merchantBalance.amount < refundAmount) {
        const reviewNote =
          note ??
          "Merchant has insufficient balance for refund. Resolve manually.";
        await tx.dispute.update({
          where: { id: disputeId },
          data: {
            status: "UNDER_REVIEW",
            adminNotes: reviewNote,
          },
        });
        await tx.auditLog.create({
          data: {
            merchantId: m.merchantId,
            action: "REFUND_BLOCKED_INSUFFICIENT_MERCHANT",
            reason: `merchantAmount=${merchantBalance?.amount ?? 0}, refund=${refundAmount}`,
            performedBy: adminId,
          },
        });
        throw new Error("MERCHANT_INSUFFICIENT");
      }

      await tx.balance.update({
        where: { userId: customerId },
        data: { amount: { increment: refundAmount } },
      });
      await tx.balance.update({
        where: { userId: merchantUserId },
        data: { amount: { decrement: refundAmount } },
      });

      await tx.merchantTransaction.update({
        where: { id: m.id },
        data: {
          refunded: true,
          refundedAt: new Date(),
          status: "FAILED",
        },
      });

      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: "RESOLVED",
          adminNotes: note ?? null,
        },
      });

      await tx.auditLog.create({
        data: {
          merchantId: m.merchantId,
          action: "DISPUTE_REFUND",
          reason: note ?? null,
          performedBy: adminId,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "ERR";
    if (msg === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (msg === "ALREADY_RESOLVED" || msg === "ALREADY_REFUNDED") {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (msg === "MERCHANT_INSUFFICIENT") {
      return NextResponse.json(
        {
          error:
            "Merchant has insufficient balance for refund. Resolve manually.",
        },
        { status: 400 },
      );
    }
    console.error("admin disputes", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
