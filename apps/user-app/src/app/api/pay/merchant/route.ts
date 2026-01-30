import prisma from "@repo/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mid = searchParams.get("mid");

  if (!mid) {
    return NextResponse.json({ error: "Missing merchant id" }, { status: 400 });
  }

  const merchant = await prisma.merchantProfile.findUnique({
    where: { userId: Number(mid) },
    select: {
      id: true,
      businessName: true,
      logoUrl: true,
      kycStatus: true,
    },
  });

  if (!merchant || merchant.kycStatus !== "VERIFIED") {
    return NextResponse.json({ error: "Merchant unavailable" }, { status: 404 });
  }

  return NextResponse.json(merchant);
}
