import { NextResponse } from "next/server"
import prisma from "@repo/db"
import { postSignedBankWebhook } from "../../../lib/signedBankWebhook"
import { logger } from "../../../lib/logger"

const ZOMBIE_SETTLEMENT_MS = 10 * 60 * 1000

async function unlock() {
  await prisma.settlementLock.update({
    where: { id: 1 },
    data: { locked: false, lockedAt: null },
  })
}

/** Mark stale PROCESSING settlements so the next cron can retry their transactions. */
async function failZombieSettlements(now: Date) {
  const cutoff = new Date(now.getTime() - ZOMBIE_SETTLEMENT_MS)
  const zombies = await prisma.settlement.updateMany({
    where: {
      status: "PROCESSING",
      createdAt: { lt: cutoff },
    },
    data: { status: "FAILED" },
  })
  if (zombies.count > 0) {
    logger.warn("auto-settlement: marked zombie settlements as FAILED", {
      count: zombies.count,
    })
  }
}

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (process.env.NODE_ENV === "production") {
    if (!cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } else if (cronSecret) {
    const auth = req.headers.get("authorization")
    if (auth && auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const now = new Date()
  const T_PLUS_2 = new Date(now)
  T_PLUS_2.setDate(T_PLUS_2.getDate() - 2)
  const inFlightCutoff = new Date(now.getTime() - ZOMBIE_SETTLEMENT_MS)

  let lockAcquired = false

  try {
    const lock = await prisma.settlementLock.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, locked: false },
    })

    if (lock.locked) {
      return NextResponse.json({
        message: "Settlement already running",
      })
    }

    await prisma.settlementLock.update({
      where: { id: 1 },
      data: { locked: true, lockedAt: now },
    })
    lockAcquired = true

    await failZombieSettlements(now)

    const transactions = await prisma.merchantTransaction.findMany({
      where: {
        status: "SUCCESS",
        settled: false,
        createdAt: { lte: T_PLUS_2 },
      },
    })

    if (transactions.length === 0) {
      return NextResponse.json({ message: "No settlements to process" })
    }

    const grouped = transactions.reduce(
      (acc, txn) => {
        acc[txn.merchantId] = acc[txn.merchantId] || []
        acc[txn.merchantId].push(txn)
        return acc
      },
      {} as Record<number, typeof transactions>,
    )

    let processed = 0
    let skipped = 0
    let failed = 0

    for (const merchantIdStr in grouped) {
      const merchantId = Number(merchantIdStr)
      const txns = grouped[merchantId]
      const amount = txns.reduce((sum, t) => sum + t.amount, 0)

      const inFlight = await prisma.settlement.findFirst({
        where: {
          merchantId,
          status: "PROCESSING",
          createdAt: { gte: inFlightCutoff },
        },
      })
      if (inFlight) {
        skipped += 1
        continue
      }

      const profile = await prisma.merchantProfile.findUnique({
        where: { id: merchantId },
        select: { userId: true },
      })
      if (!profile) {
        logger.warn("auto-settlement: merchant profile missing", { merchantId })
        failed += 1
        continue
      }

      const settlement = await prisma.settlement.create({
        data: {
          merchantId,
          amount,
          status: "PROCESSING",
          scheduledFor: T_PLUS_2,
        },
      })

      try {
        const resp = await postSignedBankWebhook("merchantSettlementWebHook", {
          settlementId: settlement.id,
          merchantId: profile.userId,
          amount,
        })

        if (!resp.ok) {
          const body = await resp.text().catch(() => "")
          throw new Error(`webhook ${resp.status}: ${body}`)
        }

        await prisma.$transaction([
          prisma.merchantTransaction.updateMany({
            where: { id: { in: txns.map((t) => t.id) } },
            data: {
              settled: true,
              settledAt: now,
              settlementId: settlement.id,
            },
          }),
          prisma.settlement.update({
            where: { id: settlement.id },
            data: {
              status: "SUCCESS",
              processedAt: now,
            },
          }),
        ])

        processed += 1
      } catch (error) {
        logger.error("auto-settlement: webhook failed for merchant", {
          merchantId,
          settlementId: settlement.id,
          error: String(error),
        })

        try {
          await prisma.settlement.update({
            where: { id: settlement.id },
            data: { status: "FAILED" },
          })
        } catch (updateErr) {
          logger.error("auto-settlement: could not mark settlement FAILED", {
            settlementId: settlement.id,
            error: String(updateErr),
          })
        }

        failed += 1
      }
    }

    return NextResponse.json({
      message: "Auto-settlement completed",
      merchants: Object.keys(grouped).length,
      processed,
      skipped,
      failed,
    })
  } catch (error) {
    logger.error("AUTO SETTLEMENT ERROR", { error: String(error) })
    return NextResponse.json({ error: "Settlement failed" }, { status: 500 })
  } finally {
    if (lockAcquired) {
      try {
        await unlock()
      } catch (unlockErr) {
        logger.error("auto-settlement: failed to release lock", {
          error: String(unlockErr),
        })
      }
    }
  }
}
