import { getServerSession } from "next-auth"
import { SendMoneyCard } from "../../../components/SendMoneyCard"
import { P2PTransaction } from "../../../components/P2PTransaction";
import { authOptions } from "../../lib/auth"
import prisma from "@repo/db";

async function getp2pTransaction(){
  const session = await getServerSession(authOptions);
  const transactions = await prisma.p2pTransfer.findMany({where: {fromUserId: Number(session?.user?.id)}})

  return transactions.map((val) => ({
    amount: val.amount,
    toUserId: val.toUserId,
    fromUserId: val.fromUserId,
    timestamp: new Date()
  }))
  
}

export default async function() {
  const transactions = await getp2pTransaction();
  return <div className="w-screen">
          <div className="text-4xl text-[#6a51a6] pt-8 mb-8 font-bold ml-4">
              Transfer
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