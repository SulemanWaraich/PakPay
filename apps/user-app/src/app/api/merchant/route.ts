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
     },
   });
 


    if (!merchant) {
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
