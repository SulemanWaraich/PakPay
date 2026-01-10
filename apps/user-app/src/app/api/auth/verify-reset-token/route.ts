import { NextResponse } from "next/server"
import crypto from "crypto"
import  prisma  from "@repo/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")

  if (!token) return NextResponse.json({ valid: false }, { status: 400 })

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

  const user = await prisma.user.findFirst({
    where: {
      resetTokenHash: tokenHash,
      resetTokenExpiry: { gt: new Date() },
    },
  })

  return NextResponse.json({ valid: !!user })
}
