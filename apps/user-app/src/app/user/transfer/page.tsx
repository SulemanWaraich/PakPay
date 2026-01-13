// app/(dashboard)/transfer/page.tsx
import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { TransferContent } from "../../../components/TransferContent";

export default async function TransferPage() {
  const session = await getServerSession(authOptions);

  const balance = await prisma.balance.findFirst({
    where: { userId: Number(session?.user?.id) },
  });

  const onrampTx = await prisma.onRampTransaction.findMany({
    where: { userId: Number(session?.user?.id) },
    orderBy: { startTime: "desc" },
  });

  const offrampTx = await prisma.offRampTransaction.findMany({
    where: { userId: Number(session?.user?.id) },
    orderBy: { startTime: "desc" },
  });

  return (
    <div className="w-screen">

    <div className="mb-4 sm:text-left text-center">

      <div className="sm:text-4xl text-2xl text-green-600 pt-8 font-bold ml-4 mb-1">
               Transfer
           </div>
          
           <p className="text-gray-600 sm:text-md text-sm ml-5">Move your money securely and instantly</p>
    </div>
     <TransferContent balance={balance} onrampTx={onrampTx} offrampTx={offrampTx} />
    </div>
  );
}
