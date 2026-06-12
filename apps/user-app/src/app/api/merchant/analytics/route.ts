import { NextResponse } from "next/server";
import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { paisaToPkr } from "../../../lib/money";

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

  const [txns, settledTxns] = await Promise.all([
    prisma.merchantTransaction.findMany({
      where: {
        merchantId: profile.id,
        status: "SUCCESS",
        createdAt: { gte: since },
      },
      select: { amount: true, createdAt: true, customerId: true },
    }),
    prisma.merchantTransaction.findMany({
      where: {
        merchantId: profile.id,
        status: "SUCCESS",
        settled: true,
        settledAt: { gte: since },
      },
      select: { amount: true, settledAt: true },
    }),
  ]);

  const totalRevenue = txns.reduce((s, t) => s + t.amount, 0);
  const byDay = new Map<string, number>();
  for (const t of txns) {
    const d = t.createdAt.toISOString().slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + t.amount);
  }

  const bySettledDay = new Map<string, number>();
  for (const t of settledTxns) {
    if (!t.settledAt) continue;
    const d = t.settledAt.toISOString().slice(0, 10);
    bySettledDay.set(d, (bySettledDay.get(d) ?? 0) + t.amount);
  }

  const customers = new Map<
    number,
    { amount: number; count: number; lastSeen: Date }
  >();
  for (const t of txns) {
    if (!t.customerId) continue;
    const existing = customers.get(t.customerId);
    if (!existing) {
      customers.set(t.customerId, {
        amount: t.amount,
        count: 1,
        lastSeen: t.createdAt,
      });
    } else {
      existing.amount += t.amount;
      existing.count += 1;
      if (t.createdAt > existing.lastSeen) {
        existing.lastSeen = t.createdAt;
      }
    }
  }

  const topCustomerIds = Array.from(customers.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5)
    .map(([customerId]) => customerId);

  const users =
    topCustomerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: topCustomerIds } },
          select: { id: true, name: true },
        })
      : [];

  const userNameById = new Map(
    users.map((u) => [u.id, u.name ?? `Customer #${u.id}`]),
  );

  const topCustomers = topCustomerIds.map((id) => {
    const agg = customers.get(id)!;
    return {
      id: String(id),
      name: userNameById.get(id) ?? `Customer #${id}`,
      total: paisaToPkr(agg.amount),
      count: agg.count,
      lastSeen: agg.lastSeen.toISOString(),
    };
  });

  return NextResponse.json({
    totalRevenue: paisaToPkr(totalRevenue),
    transactionCount: txns.length,
    uniqueCustomerCount: customers.size,
    daily: Array.from(byDay.entries()).map(([date, amount]) => ({
      date,
      amount: paisaToPkr(amount),
    })),
    dailySettled: Array.from(bySettledDay.entries()).map(([date, amount]) => ({
      date,
      amount: paisaToPkr(amount),
    })),
    topCustomers,
  });
}
