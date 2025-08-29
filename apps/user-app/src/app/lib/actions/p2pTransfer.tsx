"use server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth"
import { NextResponse } from "next/server";
import prisma from "@repo/db";

export const p2pTransfer = async (to: string, amount: number) => {
  const session = await getServerSession(authOptions);

  const from = session?.user?.id
  if(!from){
    return NextResponse.json({msg: "error while sending"})
  }

  const user = await prisma.user.findFirst({where: {number: to}});
  if(!user){
    return NextResponse.json({msg: "user not found"});
  }

  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${Number(from)} FOR UPDATE`;

    const fromBlanace = await tx.balance.findUnique({where: {userId: Number(from)}});
    if(!fromBlanace || fromBlanace.amount < amount){
      throw new Error("Insufficient Funds")
    }

    await tx.balance.update({where: {userId: Number(from)}, data: {amount: {decrement: amount}}});
    await tx.balance.update({where:  {userId: user?.id}, data: {amount: {increment: amount}}})

    await tx.p2pTransfer.create({data: {
      fromUserId: Number(from),
      toUserId: user.id,
      amount,
      timestamp: new Date()
    }})
  })
  
}