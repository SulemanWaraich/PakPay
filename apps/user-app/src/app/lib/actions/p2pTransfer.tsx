"use server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth"
import prisma from "@repo/db"
import { pkrToPaisa, paisaToPkr } from "../money"

/** @param amountPkr Whole PKR from the UI (converted to paisa before ledger writes). */
export const p2pTransfer = async (to: string, amountPkr: number) => {
  try {
    const session = await getServerSession(authOptions)
    const from = session?.user?.id

    if (!from) {
      return { success: false, message: "You must be logged in to send money." }
    }

    const user = await prisma.user.findFirst({ where: { number: to } })
    if (!user) {
      return { success: false, message: "Receiver account not found." }
    }

    const amountPaisa = pkrToPaisa(amountPkr)

    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${Number(from)} FOR UPDATE`

      let fromBalance = await tx.balance.findUnique({ where: { userId: Number(from) } })

      if (!fromBalance) {
        fromBalance = await tx.balance.create({
          data: { userId: Number(from), amount: 0, locked: 0 },
        })
      }

      if (fromBalance.amount < amountPaisa) {
        throw new Error("Insufficient funds to complete transfer.")
      }

      await tx.balance.update({
        where: { userId: Number(from) },
        data: { amount: { decrement: amountPaisa } },
      })

      await tx.balance.update({
        where: { userId: user.id },
        data: { amount: { increment: amountPaisa } },
      })

      await tx.p2pTransfer.create({
        data: {
          fromUserId: Number(from),
          toUserId: user.id,
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
