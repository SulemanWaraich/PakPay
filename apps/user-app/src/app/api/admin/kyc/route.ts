import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { NextResponse } from "next/server";
import { isApprovedPaymentQrPayload } from "../../../lib/kyc";
import { buildMerchantPayUrl, getPublicBaseUrl } from "../../../lib/publicBaseUrl";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  let baseUrl: string;
  try {
    baseUrl = getPublicBaseUrl();
  } catch {
    baseUrl = "";
  }

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { merchantId, action, reason } = await req.json();

  if (!merchantId || !["APPROVE", "REJECT"].includes(action)) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const merchant = await prisma.merchantProfile.findUnique({
    where: { id: merchantId },
    select: { id: true, kycStatus: true, qrPayload: true },
  });

  if (!merchant) {
    return NextResponse.json({ message: "Merchant not found" }, { status: 404 });
  }

  if (action === "APPROVE") {
    if (!baseUrl) {
      return NextResponse.json(
        { message: "NEXT_PUBLIC_BASE_URL is not configured" },
        { status: 500 },
      );
    }

    if (
      merchant.kycStatus === "VERIFIED" &&
      isApprovedPaymentQrPayload(merchant.qrPayload)
    ) {
      return NextResponse.json({ message: "Merchant already approved" });
    }

    const payload = buildMerchantPayUrl(merchantId);

    await prisma.$transaction([
      prisma.merchantProfile.update({
        where: { id: merchantId },
        data: {
          kycStatus: "VERIFIED",
          kycReviewNote: null,
          qrPayload: payload,
        },
      }),
      prisma.auditLog.create({
        data: {
          merchantId,
          action: "KYC_APPROVE",
          reason: reason || null,
          performedBy: Number(session.user.id),
        },
      }),
    ]);

    return NextResponse.json({
      message: "Merchant VERIFIED",
      qrPayload: payload,
    });
  }

  await prisma.$transaction([
    prisma.merchantProfile.update({
      where: { id: merchantId },
      data: {
        kycStatus: "REJECTED",
        kycReviewNote: reason ?? null,
        qrPayload: null,
      },
    }),
    prisma.auditLog.create({
      data: {
        merchantId,
        action: "KYC_REJECT",
        reason: reason || null,
        performedBy: Number(session.user.id),
      },
    }),
  ]);

  return NextResponse.json({ message: "Merchant REJECTED" });
}
