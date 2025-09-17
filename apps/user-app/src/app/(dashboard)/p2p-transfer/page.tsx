import { getServerSession } from "next-auth"
import { SendMoneyCard } from "../../../components/SendMoneyCard"
import { P2PTransaction } from "../../../components/P2PTransaction";
import { authOptions } from "../../lib/auth"
import prisma from "@repo/db";

async function getp2pTransaction(){
  const session = await getServerSession(authOptions);
  const transactions = await prisma.p2pTransfer.findMany({where: {fromUserId: Number(session?.user?.id)},  cacheStrategy: { ttl: 60 },})

  return transactions.map((val: any) => ({
    amount: val.amount,
    toUserId: val.toUserId,
    fromUserId: val.fromUserId,
    timestamp: new Date()
  }))
  
}

export default async function() {
  const transactions = await getp2pTransaction();
  return <div className="w-screen">
          <div className="text-4xl text-green-600 pt-8 mb-8 font-bold ml-4">
              P2P Transfer
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 p-4">
              <div>
                  <SendMoneyCard />
              </div>
              <div>
                  <div className="pt-4">
                    <P2PTransaction transactions={transactions}/>
                  </div>
              </div>
          </div>
      </div>
}