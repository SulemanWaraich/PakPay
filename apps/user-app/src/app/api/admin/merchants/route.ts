import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from  "../../../lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const merchants = await prisma.merchantProfile.findMany({
    select: {
      id: true,
      businessName: true,
      category: true,
      address: true,
      kycStatus: true,
      qrPayload: true,
      logoUrl: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(merchants);
}
