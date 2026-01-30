import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { NextResponse } from "next/server";
import { generateQr } from "../../../lib/qr";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

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
      data: { kycStatus },
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
  const payload = `PAKPAY-${merchantId}-${Date.now()}`;

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
