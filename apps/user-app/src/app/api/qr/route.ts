export const runtime = "nodejs"
import  prisma  from "@repo/db";
import { getServerSession } from "next-auth"
import { authOptions } from "../../lib/auth"
import { NextResponse } from "next/server";
import cloudinary from "../../lib/cloudinary";
import { MerchantCategory } from "@prisma/client";
import  QRCode  from "qrcode";


export async function GET() {
 try {
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
       idDocumentUrl: true,
       businessLicenseUrl: true,
       addressProofUrl: true,
     },
   });
 

    if (!merchant || !merchant.businessName || !merchant.category || !merchant.address) {
     return NextResponse.json(
       { error: "QR not available" },
       { status: 403 }
     );
   }



//    if (!merchant || !merchant.qrPayload) {
//   return new Response(
//     JSON.stringify({ error: "QR payload missing" }),
//     { status: 400 }
//   )
// }

 
const qr =
  merchant.qrPayload && merchant.qrPayload.trim() !== ""
    ? await QRCode.toDataURL(merchant.qrPayload)
    : null
 
   return NextResponse.json({ ...merchant, qr });
 
 } catch (error) {
    console.error("merchant fetch error:", error);
    return NextResponse.json(
      { error: "Suleman" },
      { status: 500 }
    );
 }
  
}


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

     // Optional: check if role is 'MERCHANT' (if you have roles)
    if (session.user.role && session.user.role !== "MERCHANT") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }


    const userId = Number(session.user.id);

    // ⚠️ IMPORTANT: read FormData, not JSON
    const formData = await req.formData();

    const businessName = formData.get("businessName") as string;
    const category = formData.get("category") as string;
    const address = formData.get("address") as string;
    const logoFile = formData.get("logo") as File | null;
    const idDocumentFile = formData.get("idDocument") as File | null;
    const businessLicenseFile = formData.get("businessLicense") as File | null;
    const addressProofFile = formData.get("addressProof") as File | null;

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

    if (merchant.kycStatus === "VERIFIED") {
  return NextResponse.json(
    { message: "Profile locked after verification" },
    { status: 403 }
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

    // Upload KYC documents
    let idDocumentUrl = merchant.idDocumentUrl;
    let idDocumentPublicId = merchant.idDocumentPublicId;
    let businessLicenseUrl = merchant.businessLicenseUrl;
    let businessLicensePublicId = merchant.businessLicensePublicId;
    let addressProofUrl = merchant.addressProofUrl;
    let addressProofPublicId = merchant.addressProofPublicId;

    // Upload ID Document
    if (idDocumentFile && idDocumentFile.size > 0) {
      if (merchant.idDocumentPublicId) {
        await cloudinary.uploader.destroy(merchant.idDocumentPublicId);
      }
      const bytes = await idDocumentFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "pakpay/kyc/id-documents",
              public_id: `merchant_${userId}_id_document`,
              overwrite: true,
            },
            (error, result) => {
              if (error) reject(error);
              resolve(result);
            }
          )
          .end(buffer);
      });
      idDocumentUrl = uploadResult.secure_url;
      idDocumentPublicId = uploadResult.public_id;
    }

    // Upload Business License
    if (businessLicenseFile && businessLicenseFile.size > 0) {
      if (merchant.businessLicensePublicId) {
        await cloudinary.uploader.destroy(merchant.businessLicensePublicId);
      }
      const bytes = await businessLicenseFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "pakpay/kyc/business-licenses",
              public_id: `merchant_${userId}_business_license`,
              overwrite: true,
            },
            (error, result) => {
              if (error) reject(error);
              resolve(result);
            }
          )
          .end(buffer);
      });
      businessLicenseUrl = uploadResult.secure_url;
      businessLicensePublicId = uploadResult.public_id;
    }

    // Upload Address Proof
    if (addressProofFile && addressProofFile.size > 0) {
      if (merchant.addressProofPublicId) {
        await cloudinary.uploader.destroy(merchant.addressProofPublicId);
      }
      const bytes = await addressProofFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "pakpay/kyc/address-proof",
              public_id: `merchant_${userId}_address_proof`,
              overwrite: true,
            },
            (error, result) => {
              if (error) reject(error);
              resolve(result);
            }
          )
          .end(buffer);
      });
      addressProofUrl = uploadResult.secure_url;
      addressProofPublicId = uploadResult.public_id;
    }

   await prisma.merchantProfile.upsert({
  where: { userId },
  update: {
    businessName,
    category: category as MerchantCategory,
    address,
    logoUrl,
    logoPublicId,
    idDocumentUrl,
    idDocumentPublicId,
    businessLicenseUrl,
    businessLicensePublicId,
    addressProofUrl,
    addressProofPublicId,
   // 🔹 Only set PENDING if current status is not VERIFIED
    kycStatus: merchant.kycStatus === "PENDING" ? "PENDING" : "VERIFIED",
  },
  create: {
    userId,
    businessName,
    category: category as MerchantCategory,
    address,
    logoUrl,
    logoPublicId,
    idDocumentUrl,
    idDocumentPublicId,
    businessLicenseUrl,
    businessLicensePublicId,
    addressProofUrl,
    addressProofPublicId,
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
