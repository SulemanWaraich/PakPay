import { NextResponse } from "next/server";
import prisma from "@repo/db";

export async function GET() {
  try {
    const offRamps = await prisma.offRampTransaction.findMany({
      select: { amount: true, startTime: true },
    });

    const p2pTransfers = await prisma.p2pTransfer.findMany({
      select: { amount: true, timestamp: true },
    });

    const onRamps = await prisma.onRampTransaction.findMany({
      select: { amount: true, startTime: true },
    });

    // ✅ Weeks structure
    const spendingData = [
      { name: "Week 1", offRamp: 0, p2p: 0, onRamp: 0 },
      { name: "Week 2", offRamp: 0, p2p: 0, onRamp: 0 },
      { name: "Week 3", offRamp: 0, p2p: 0, onRamp: 0 },
      { name: "Week 4", offRamp: 0, p2p: 0, onRamp: 0 },
    ];

    // ✅ OffRamps
    offRamps.forEach((t: any) => {
      const d = new Date(t.startTime);
      const week = Math.ceil(d.getDate() / 7);
      if (week >= 1 && week <= 4) {
        spendingData[week - 1].offRamp += t.amount;
      }
    });

    // ✅ P2P
    p2pTransfers.forEach((t: any) => {
      const d = new Date(t.timestamp);
      const week = Math.ceil(d.getDate() / 7);
      if (week >= 1 && week <= 4) {
        spendingData[week - 1].p2p += t.amount;
      }
    });

    // ✅ OnRamp
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
