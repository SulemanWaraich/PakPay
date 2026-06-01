import { NextResponse } from "next/server"
import prisma, { prismaPlain } from "@repo/db"
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

/** Link transactions to an existing SUCCESS settlement (webhook already debited). */
async function linkTransactionsToSettlement(
  settlementId: number,
  txnIds: number[],
  now: Date,
) {
  await prismaPlain.$transaction([
    prisma.merchantTransaction.updateMany({
      where: { id: { in: txnIds } },
      data: {
        settled: true,
        settledAt: now,
        settlementId,
      },
    }),
    prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: "SUCCESS",
        processedAt: now,
      },
    }),
  ])
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
  const reconcileCutoff = new Date(now.getTime() - ZOMBIE_SETTLEMENT_MS)

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
    let reconciled = 0

    for (const merchantIdStr in grouped) {
      const merchantProfileId = Number(merchantIdStr)
      const txns = grouped[merchantProfileId]
      const amount = txns.reduce((sum, t) => sum + t.amount, 0)
      const txnIds = txns.map((t) => t.id)

      const profile = await prisma.merchantProfile.findUnique({
        where: { id: merchantProfileId },
        select: { userId: true },
      })
      if (!profile) {
        logger.warn("auto-settlement: merchant profile missing", {
          merchantProfileId,
        })
        failed += 1
        continue
      }

      const openProcessing = await prisma.settlement.findFirst({
        where: {
          merchantId: merchantProfileId,
          status: "PROCESSING",
        },
      })
      if (openProcessing) {
        skipped += 1
        continue
      }

      const successNeedsLink = await prisma.settlement.findFirst({
        where: {
          merchantId: merchantProfileId,
          status: "SUCCESS",
          amount,
          createdAt: { gte: reconcileCutoff },
        },
        orderBy: { id: "desc" },
      })

      if (successNeedsLink) {
        try {
          await linkTransactionsToSettlement(successNeedsLink.id, txnIds, now)
          reconciled += 1
          processed += 1
        } catch (error) {
          logger.error("auto-settlement: reconcile SUCCESS settlement failed", {
            settlementId: successNeedsLink.id,
            error: String(error),
          })
          try {
            await prisma.settlement.update({
              where: { id: successNeedsLink.id },
              data: { status: "FAILED" },
            })
          } catch {
            // ignore
          }
          failed += 1
        }
        continue
      }

      const settlement = await prisma.settlement.create({
        data: {
          merchantId: merchantProfileId,
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

        try {
          await linkTransactionsToSettlement(settlement.id, txnIds, now)
          processed += 1
        } catch (linkError) {
          logger.error("auto-settlement: post-webhook link failed", {
            merchantProfileId,
            settlementId: settlement.id,
            error: String(linkError),
          })
          await prisma.settlement.update({
            where: { id: settlement.id },
            data: { status: "FAILED" },
          })
          failed += 1
        }
      } catch (error) {
        logger.error("auto-settlement: webhook failed for merchant", {
          merchantProfileId,
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
      reconciled,
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
