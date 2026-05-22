export const runtime = "nodejs"
import prisma from "@repo/db";
import { getServerSession } from "next-auth"
import { authOptions } from "../../lib/auth"
import { NextResponse } from "next/server";
import cloudinary from "../../lib/cloudinary";
import { MerchantCategory } from "@prisma/client";
import QRCode from "qrcode";
import { isApprovedPaymentQrPayload } from "../../lib/kyc";
import { AUTH_MESSAGES, jsonError } from "../../lib/apiErrors";

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return jsonError(AUTH_MESSAGES.NOT_LOGGED_IN, 401);
    }

    const merchant = await prisma.merchantProfile.findUnique({
      where: { userId: Number(session.user.id) },
      select: {
        id: true,
        ownerName: true,
        qrPayload: true,
        businessName: true,
        category: true,
        address: true,
        kycStatus: true,
        logoUrl: true,
      },
    });

    if (!merchant || !merchant.businessName || !merchant.category || !merchant.address) {
      return jsonError(
        "Complete your business name, category, and address before using QR.",
        403,
      );
    }

    const qr = isApprovedPaymentQrPayload(merchant.qrPayload)
      ? await QRCode.toDataURL(merchant.qrPayload!)
      : null;

    return NextResponse.json({ ...merchant, qr });

  } catch (error) {
    console.error("merchant fetch error:", error);
    return jsonError("Could not load QR details. Please try again.", 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return jsonError(AUTH_MESSAGES.NOT_LOGGED_IN, 401);
    }

    if (session.user.role && session.user.role !== "MERCHANT") {
      return jsonError("Only merchant accounts can update a business profile.", 403);
    }

    const userId = Number(session.user.id);

    const formData = await req.formData();

    const businessName = formData.get("businessName") as string;
    const categoryRaw = formData.get("category") as string;
    const address = formData.get("address") as string;
    const logoFile = formData.get("logo") as File | null;

    if (!businessName || !categoryRaw || !address) {
      return jsonError("Business name, category, and address are all required.", 400);
    }

    // ✅ Normalize category to uppercase and validate against enum
    const categoryUpper = categoryRaw.toUpperCase() as MerchantCategory;
    const validCategories = Object.values(MerchantCategory);
    if (!validCategories.includes(categoryUpper)) {
      return jsonError(
        `Invalid category. Choose one of: ${validCategories.join(", ")}.`,
        400,
      );
    }

    const merchant = await prisma.merchantProfile.findUnique({ where: { userId } });

    if (!merchant) {
      return jsonError("Merchant profile not found. Contact support.", 404);
    }

    if (merchant.kycStatus === "VERIFIED") {
      return jsonError(
        "Your profile is locked after verification. Contact support to request changes.",
        403,
      );
    }

    let logoUrl = merchant.logoUrl;
    let logoPublicId = merchant.logoPublicId;

    if (logoFile && logoFile.size > 0) {
      if (merchant.logoPublicId) {
        await cloudinary.uploader.destroy(merchant.logoPublicId);
      }

      const bytes = await logoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "pakpay/merchants",
              public_id: `merchant_${userId}_logo`,
              overwrite: true,
            },
            (error, result) => {
              if (error) reject(error);
              resolve(result);
            }
          )
          .end(buffer);
      });

      logoUrl = uploadResult.secure_url;
      logoPublicId = uploadResult.public_id;
    }

    const updated = await prisma.merchantProfile.update({
      where: { userId },
      data: {
        businessName,
        category: categoryUpper,
        address,
        logoUrl,
        logoPublicId,
        // kycStatus is only changed by KYC document submit or admin approve/reject
      },
      select: { kycStatus: true },
    });

    return NextResponse.json({
      message: "Business profile saved. Verification pending.",
      kycStatus: updated.kycStatus,
    });

  } catch (err) {
    console.error("Merchant profile error:", err);
    return jsonError("Could not save your business profile. Please try again.", 500);
  }
}