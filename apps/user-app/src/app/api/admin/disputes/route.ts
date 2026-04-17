import { NextResponse } from "next/server";
import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
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
  const adminId = Number(session.user.id);

  try {
    await prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: { merchantTransaction: true },
      });
      if (!dispute) {
        throw new Error("NOT_FOUND");
      }
      if (
        dispute.status === "RESOLVED_REFUNDED" ||
        dispute.status === "RESOLVED_REJECTED"
      ) {
        throw new Error("ALREADY_RESOLVED");
      }

      const m = dispute.merchantTransaction;
      if (!m.customerId) {
        throw new Error("NO_CUSTOMER");
      }

      if (action === "REJECT") {
        await tx.dispute.update({
          where: { id: disputeId },
          data: {
            status: "RESOLVED_REJECTED",
            resolutionNote: note ?? null,
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

      await tx.balance.update({
        where: { userId: m.customerId },
        data: { amount: { increment: m.amount } },
      });
      await tx.balance.update({
        where: { userId: profile.userId },
        data: { amount: { decrement: m.amount } },
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
          status: "RESOLVED_REFUNDED",
          resolutionNote: note ?? null,
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
    console.error("admin disputes", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
