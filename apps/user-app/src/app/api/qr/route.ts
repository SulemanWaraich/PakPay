import  prisma  from "@repo/db";
import { getServerSession } from "next-auth"
import { authOptions } from "../../lib/auth"
import { NextResponse } from "next/server";
import cloudinary from "../../lib/cloudinary";
import { MerchantCategory } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions)


  if (!session?.user?.id ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  if (!merchant) {
    return NextResponse.json(
      { error: "Merchant profile not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(merchant);

  
}


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);

    // ⚠️ IMPORTANT: read FormData, not JSON
    const formData = await req.formData();

    const businessName = formData.get("businessName") as string;
    const category = formData.get("category") as string;
    const address = formData.get("address") as string;
    const logoFile = formData.get("logo") as File | null;

    if (!businessName || !category || !address) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const merchant = await prisma.merchantProfile.findUnique({
      where: { userId },
    });

    if (!merchant) {
      return NextResponse.json(
        { message: "Merchant profile not found" },
        { status: 404 }
      );
    }

    let logoUrl = merchant.logoUrl;
    let logoPublicId = merchant.logoPublicId;

    // 🔥 Upload new logo if provided
    if (logoFile && logoFile.size > 0) {
      // delete old logo
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

   await prisma.merchantProfile.upsert({
  where: { userId },
  update: {
    businessName,
    category: category as MerchantCategory,
    address,
    logoUrl,
    logoPublicId,
    kycStatus: "PENDING",
  },
  create: {
    userId,
    businessName,
    category: category as MerchantCategory,
    address,
    logoUrl,
    logoPublicId,
    qrPayload: `PAKPAY-${userId}-${Date.now()}`,
  },
});

    return NextResponse.json({
      message: "Business profile saved. Verification pending.",
    });
  } catch (err) {
    console.error("Merchant profile error:", err);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
