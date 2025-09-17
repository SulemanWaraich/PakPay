import { NextResponse } from "next/server";
import prisma from "@repo/db";

export async function GET() {
  try {
    // OffRamp (spending)
    const offRamps = await prisma.offRampTransaction.findMany({
      select: { amount: true, startTime: true },
    });

    // P2P transfers (spending)
    const p2pTransfers = await prisma.p2pTransfer.findMany({
      select: { amount: true, timestamp: true },
    });

    // OnRamp (incoming money)
    const onRamps = await prisma.onRampTransaction.findMany({
      select: { amount: true, startTime: true },
    });

    const spendingData = [
      { name: "Week 1", spend: 0, onRamp: 0 },
      { name: "Week 2", spend: 0, onRamp: 0 },
      { name: "Week 3", spend: 0, onRamp: 0 },
      { name: "Week 4", spend: 0, onRamp: 0 },
    ];

    // Add spending
    [...offRamps, ...p2pTransfers].forEach((t: any) => {
      const d = new Date(t.startTime || t.timestamp);
      const week = Math.ceil(d.getDate() / 7);
      if (week >= 1 && week <= 4) {
        spendingData[week - 1].spend += t.amount;
      }
    });

    // Add onRamp income
    onRamps.forEach((t: any) => {
      const d = new Date(t.startTime);
      const week = Math.ceil(d.getDate() / 7);
      if (week >= 1 && week <= 4) {
        spendingData[week - 1].onRamp += t.amount;
      }
    });

    return NextResponse.json(spendingData);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch activity data" }, { status: 500 });
  }
}
