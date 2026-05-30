"use server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth"
import prisma from "@repo/db"
import { pkrToPaisa, paisaToPkr } from "../money"
import { availableBalancePaisa } from "../balance"
import { rateLimitAllow } from "../rateLimitRedis"

/** @param amountPkr Whole PKR from the UI (converted to paisa before ledger writes). */
export const p2pTransfer = async (to: string, amountPkr: number) => {
  try {
    const session = await getServerSession(authOptions)
    const from = session?.user?.id

    if (!from) {
      return { success: false, message: "You must be logged in to send money." }
    }

    const fromUserId = Number(from);
    if (!(await rateLimitAllow(`rl:user:p2p:${fromUserId}`, 30, 60))) {
      return { success: false, message: "Too many requests" }
    }

    const user = await prisma.user.findFirst({ where: { number: to } })
    if (!user) {
      return { success: false, message: "Receiver account not found." }
    }

    const amountPaisa = pkrToPaisa(amountPkr)
    const toUserId = user.id

    await prisma.$transaction(async (tx) => {
      const [lockFirst, lockSecond] =
        fromUserId < toUserId ? [fromUserId, toUserId] : [toUserId, fromUserId]

      await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${lockFirst} FOR UPDATE`
      await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${lockSecond} FOR UPDATE`

      let fromBalance = await tx.balance.findUnique({ where: { userId: fromUserId } })

      if (!fromBalance) {
        fromBalance = await tx.balance.create({
          data: { userId: fromUserId, amount: 0, locked: 0 },
        })
      }

      if (availableBalancePaisa(fromBalance.amount, fromBalance.locked) < amountPaisa) {
        throw new Error("Insufficient funds to complete transfer.")
      }

      let toBalance = await tx.balance.findUnique({ where: { userId: toUserId } })
      if (!toBalance) {
        toBalance = await tx.balance.create({
          data: { userId: toUserId, amount: 0, locked: 0 },
        })
      }

      await tx.balance.update({
        where: { userId: fromUserId },
        data: { amount: { decrement: amountPaisa } },
      })

      await tx.balance.update({
        where: { userId: toUserId },
        data: { amount: { increment: amountPaisa } },
      })

      await tx.p2pTransfer.create({
        data: {
          fromUserId,
          toUserId,
          amount: amountPaisa,
          timestamp: new Date(),
        },
      })
    })

    return {
      success: true,
      message: `Successfully sent Rs. ${paisaToPkr(amountPaisa).toFixed(2)} to ${to}.`,
    }
  } catch (error: any) {
    return { success: false, message: error.message || "Transaction failed. Please try again later." }
  }
}
