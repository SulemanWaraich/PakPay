export const dynamic = 'force-dynamic';
import  prisma  from "@repo/db";
import { getServerSession } from "next-auth"
import { authOptions } from "../../lib/auth"
import { NextResponse } from "next/server";
import cloudinary from "../../lib/cloudinary";
// import { MerchantCategory } from "@prisma/client";
import QRCode from "qrcode";
import { isApprovedPaymentQrPayload } from "../../lib/kyc";
import { resolveMerchantQrPayload } from "../../lib/merchantQr";
import { AUTH_MESSAGES, jsonError } from "../../lib/apiErrors";


export async function GET() {
 try {
   const session = await getServerSession(authOptions)
 
 
   if (!session?.user?.id ) {
     return jsonError(AUTH_MESSAGES.NOT_LOGGED_IN, 401);
   }

   if (session.user.role !== "MERCHANT") {
     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
   }

   const merchantUserId = Number(session.user.id);

   const merchant = await prisma.merchantProfile.findUnique({
     where: { userId: merchantUserId },
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
     return jsonError("Merchant profile not found.", 404);
   }



//    if (!merchant || !merchant.qrPayload) {
//   return new Response(
//     JSON.stringify({ error: "QR payload missing" }),
//     { status: 400 }
//   )
// }

 
    const qrPayload = await resolveMerchantQrPayload(prisma, merchant);

    const qr = isApprovedPaymentQrPayload(qrPayload)
      ? await QRCode.toDataURL(qrPayload!)
      : null;

    return NextResponse.json({ ...merchant, qrPayload, qr });
 
 } catch (error) {
    console.error("merchant fetch error:", error);
    return jsonError("Could not load merchant profile. Please try again.", 500);
 }
  
}
