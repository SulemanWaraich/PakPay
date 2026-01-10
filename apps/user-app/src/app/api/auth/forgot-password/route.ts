import { NextResponse } from "next/server"
import crypto from "crypto"
import  prisma  from "@repo/db"
import { sendResetEmail } from "../../../lib/mailer"

export async function POST(req: Request) {
  const { email } = await req.json()

  const user = await prisma.user.findUnique({ where: { email } })

  // Always return success (security)
  if (!user) {
    return NextResponse.json({ message: "If email exists, reset link sent" })
  }

  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

  await prisma.user.update({
    where: { email },
    data: {
      resetTokenHash: tokenHash,
      resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    },
  })

  const resetLink = `${process.env.NEXTAUTH_URL}/auth/resetPass?token=${token}`

  await sendResetEmail(email, resetLink)

  return NextResponse.json({ message: "If email exists, reset link sent" })
}
