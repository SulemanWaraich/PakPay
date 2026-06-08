import { getServerSession } from "next-auth"
import { SendMoneyCard } from "../../../components/SendMoneyCard"
import { P2PTransaction } from "../../../components/P2PTransaction"
import { authOptions } from "../../lib/auth"
import { prismaPlain } from "@repo/db"
import { redirect } from "next/navigation"

async function getP2pTransactions(userId: number) {
  const transactions = await prismaPlain.p2pTransfer.findMany({
    where: {
      OR: [{ fromUserId: userId }, { toUserId: userId }],
    },
    include: {
      fromUser: { select: { name: true, number: true } },
      toUser: { select: { name: true, number: true } },
    },
    orderBy: { timestamp: "desc" },
    take: 10,
  })

  return transactions.map((val) => ({
    amount: val.amount,
    toUserId: val.toUserId,
    fromUserId: val.fromUserId,
    timestamp: val.timestamp,
    fromUser: val.fromUser,
    toUser: val.toUser,
  }))
}

export default async function P2PTransferPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const userId = Number(session.user.id)
  const transactions = await getP2pTransactions(userId)

  return (
    <div className="w-screen">
      <div className="mb-4 sm:text-left text-center">
        <div className="sm:text-4xl text-2xl text-green-600 pt-8 font-bold ml-4 mb-1">
          P2P Transfer
        </div>
        <p className="text-gray-600 sm:text-md text-sm ml-4">
          Fast, secure, and hassle-free peer payments
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 p-4">
        <div>
          <SendMoneyCard />
        </div>
        <div>
          <div className="pt-4">
            <P2PTransaction currentUserId={userId} transactions={transactions} />
          </div>
        </div>
      </div>
    </div>
  )
}
