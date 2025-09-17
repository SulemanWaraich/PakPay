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

      <div className="text-4xl text-green-600 pt-8 mb-8 font-bold ml-4">
               Transfer
           </div>
     <TransferContent balance={balance} onrampTx={onrampTx} offrampTx={offrampTx} />
    </div>
  );
}
