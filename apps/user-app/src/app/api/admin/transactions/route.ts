import { NextResponse } from "next/server";
import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [onRamp, offRamp, p2p, merchant, disputes] = await Promise.all([
    prisma.onRampTransaction.findMany({
      orderBy: { startTime: "desc" },
      take: 50,
      include: { user: { select: { email: true, id: true } } },
    }),
    prisma.offRampTransaction.findMany({
      orderBy: { startTime: "desc" },
      take: 50,
      include: { user: { select: { email: true, id: true } } },
    }),
    prisma.p2pTransfer.findMany({
      orderBy: { timestamp: "desc" },
      take: 50,
    }),
    prisma.merchantTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        merchant: { select: { businessName: true, id: true } },
        customer: { select: { email: true, id: true } },
      },
    }),
    prisma.dispute.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        MerchantTransaction: { select: { amount: true, id: true } },
        User: { select: { email: true, id: true } },
      },
    }),
  ]);

  return NextResponse.json({
    onRamp,
    offRamp,
    p2p,
    merchant,
    disputes,
  });
}
