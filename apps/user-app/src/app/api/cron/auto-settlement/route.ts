import { NextResponse } from "next/server"
import prisma from "@repo/db"

export async function POST() {
  const now = new Date()
  const T_PLUS_2 = new Date(now)
  T_PLUS_2.setDate(T_PLUS_2.getDate() - 2)

  try {
    // 🔒 1️⃣ Acquire lock (idempotency)
    const lock = await prisma.settlementLock.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, locked: false }
    })

    if (lock.locked) {
      return NextResponse.json({
        message: "Settlement already running"
      })
    }

    await prisma.settlementLock.update({
      where: { id: 1 },
      data: { locked: true, lockedAt: new Date() }
    })

    // 🔍 2️⃣ Fetch eligible transactions (T+2, SUCCESS, not settled)
    const transactions = await prisma.merchantTransaction.findMany({
      where: {
        status: "SUCCESS",
        settled: false,
        createdAt: {
          lte: T_PLUS_2
        }
      }
    })

    if (transactions.length === 0) {
      await unlock()
      return NextResponse.json({ message: "No settlements to process" })
    }

    // 🧮 3️⃣ Group transactions by merchant
    const grouped = transactions.reduce((acc, txn) => {
      acc[txn.merchantId] = acc[txn.merchantId] || []
      acc[txn.merchantId].push(txn)
      return acc
    }, {} as Record<number, typeof transactions>)

    // 🏦 4️⃣ Process settlements per merchant
    for (const merchantIdStr in grouped) {
      const merchantId = Number(merchantIdStr)
      const txns = grouped[merchantId]

      const amount = txns.reduce((sum, t) => sum + t.amount, 0)

      const settlement = await prisma.settlement.create({
        data: {
          merchantId,
          amount,
          status: "PROCESSING",
          scheduledFor: T_PLUS_2,
          processedAt: new Date()
        },
      });

      // 🔗 Link transactions → settlement
      await prisma.merchantTransaction.updateMany({
        where: {
          id: { in: txns.map(t => t.id) }
        },
        data: {
          settled: true,
          settledAt: new Date(),
          settlementId: settlement.id
        }
      });
    
      await fetch("http://localhost:3003/merchantSettlementWebHook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settlementId: settlement.id,
          merchantId,
          amount,
        }),
      });
    }

    // 🔓 5️⃣ Release lock
    await unlock()

    return NextResponse.json({
      message: "Auto-settlement triggered",
      merchants: Object.keys(grouped).length
    })

  } catch (error) {
    console.error("AUTO SETTLEMENT ERROR:", error)
    await unlock()

    return NextResponse.json(
      { error: "Settlement failed" },
      { status: 500 }
    )
  }
}

// 🔓 Helper
async function unlock() {
  await prisma.settlementLock.update({
    where: { id: 1 },
    data: { locked: false }
  })
}
