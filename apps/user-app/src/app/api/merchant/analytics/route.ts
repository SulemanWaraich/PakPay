import { NextResponse } from "next/server";
import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "MERCHANT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await prisma.merchantProfile.findUnique({
    where: { userId: Number(session.user.id) },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "No merchant profile" }, { status: 404 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const txns = await prisma.merchantTransaction.findMany({
    where: {
      merchantId: profile.id,
      status: "SUCCESS",
      createdAt: { gte: since },
    },
    select: { amount: true, createdAt: true, customerId: true },
  });

  const totalRevenue = txns.reduce((s, t) => s + t.amount, 0);
  const byDay = new Map<string, number>();
  for (const t of txns) {
    const d = t.createdAt.toISOString().slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + t.amount);
  }
  const customers = new Map<number, number>();
  for (const t of txns) {
    if (t.customerId) {
      customers.set(t.customerId, (customers.get(t.customerId) ?? 0) + t.amount);
    }
  }
  const topCustomers = Array.from(customers.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([customerId, amount]) => ({ customerId, amount }));

  return NextResponse.json({
    totalRevenue,
    transactionCount: txns.length,
    daily: Array.from(byDay.entries()).map(([date, amount]) => ({ date, amount })),
    topCustomers,
  });
}
