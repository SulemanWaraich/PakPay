import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { merchantId, action, reason } = await req.json();

  if (!merchantId || !["APPROVE", "REJECT"].includes(action)) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const kycStatus = action === "APPROVE" ? "VERIFIED" : "REJECTED";

  await prisma.$transaction([
    prisma.merchantProfile.update({
      where: { id: merchantId },
      data: {
        kycStatus,
        kycReviewNote:
          action === "REJECT" ? (reason ?? null) : null,
      },
    }),
    prisma.auditLog.create({
      data: {
        merchantId,
        action: `KYC_${action}`,
        reason: reason || null,
        performedBy: Number(session.user.id),
      },
    }), 
  ]);

  if (action === "APPROVE") {
  const payload = `${BASE_URL}/pay?v=1&type=merchant&mid=${merchantId}`;

  await prisma.merchantProfile.update({
    where: { id: merchantId },
    data: {
      kycStatus: "VERIFIED",
      qrPayload: payload,
    },
  });
}


  return NextResponse.json({ message: `Merchant ${kycStatus}` });
}
