import prisma from "@repo/db";
import { NextResponse } from "next/server";
import { isApprovedPaymentQrPayload } from "../../../lib/kyc";
import { jsonError } from "../../../lib/apiErrors";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mid = searchParams.get("mid");

  if (!mid || Number.isNaN(Number(mid))) {
    return jsonError("Invalid payment link: merchant ID is missing.", 400);
  }

  const merchant = await prisma.merchantProfile.findUnique({
    where: { id: Number(mid) },
    select: {
      id: true,
      businessName: true,
      logoUrl: true,
      kycStatus: true,
      qrPayload: true,
    },
  });

  if (
    !merchant ||
    merchant.kycStatus !== "VERIFIED" ||
    !isApprovedPaymentQrPayload(merchant.qrPayload)
  ) {
    return jsonError(
      "This merchant is not accepting payments yet (pending verification).",
      404,
    );
  }

  return NextResponse.json({
    id: merchant.id,
    businessName: merchant.businessName,
    logoUrl: merchant.logoUrl,
    kycStatus: merchant.kycStatus,
  });
}
