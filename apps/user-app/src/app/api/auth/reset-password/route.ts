import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import  prisma  from "@repo/db"

export async function POST(req: Request) {
  const { token, password } = await req.json()

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

  const user = await prisma.user.findFirst({
    where: {
      resetTokenHash: tokenHash,
      resetTokenExpiry: { gt: new Date() },
    },
  })

  if (!user) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetTokenHash: null,
      resetTokenExpiry: null,
    },
  })

  return NextResponse.json({ message: "Password reset successful" })
}
