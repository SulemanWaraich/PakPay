"use server"
import prisma from "@repo/db"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth"
import { NextResponse } from "next/server"

export const CreateOnRampTransaction = async (amount: any, provider: any) => {
  const session = await getServerSession(authOptions);
  if(!session.user){
    return {
      msg: "user not logged in"
    }
  }
  console.log(session, session.user)
  const token = String(Math.random() * 100);
  const txn = await prisma.onRampTransaction.create({data: {
      userId: Number(session?.user?.id),
      token: token,
      startTime: new Date(),
      amount: amount,
      provider: provider,
      status: "Processing"
  }})

  if(!txn){
    return {msg: "transaction failed"}
  }
  console.log("success")
  return NextResponse.json({msg: "transaction successfull"})
}