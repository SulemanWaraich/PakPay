import { NextResponse } from "next/server";
import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import cloudinary from "../../../lib/cloudinary";

export const runtime = "nodejs";

export async function POST(req: Request) {
  console.log("[kyc] 0. handler reached");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "MERCHANT") {
    console.log("[kyc] 1. session:", session?.user?.id, session?.user?.role);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const front = form.get("cnicFront");
  const back = form.get("cnicBack");
  const proof = form.get("proofOfAddress");

  if (!(front instanceof File) || !(back instanceof File)) {
    return NextResponse.json(
      { error: "cnicFront and cnicBack files required" },
      { status: 400 },
    );
  }

  const upload = async (file: File, tag: string) => {
    const buf = Buffer.from(await file.arrayBuffer());
    const res = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "pakpay/kyc", tags: [tag] }, (err, result) => {
          if (err || !result?.secure_url) reject(err ?? new Error("upload failed"));
          else resolve({ secure_url: result.secure_url });
        })
        .end(buf);
    });
    return res.secure_url;
  };

  try {
    console.log("[kyc] 1. session ok, userId:", session.user.id);

    const cnicFrontUrl = await upload(front, "cnic-front");
    console.log("[kyc] 2. front uploaded:", cnicFrontUrl);
  
    const cnicBackUrl = await upload(back, "cnic-back");
    console.log("[kyc] 3. back uploaded:", cnicBackUrl);
    
    let proofOfAddressUrl: string | null = null;
    if (proof instanceof File && proof.size > 0) {
      proofOfAddressUrl = await upload(proof, "poa");
      console.log("[kyc] 4. proof uploaded:", proofOfAddressUrl);
    }

    console.log("[kyc] 5. updating merchant profile");
    const updated = await prisma.merchantProfile.update({
      where: { userId: Number(session.user.id) },
      data: {
        cnicFrontUrl,
        cnicBackUrl,
        proofOfAddressUrl,
        kycSubmittedAt: new Date(),
        kycStatus: "SUBMITTED",
      },
    });

    console.log("[kyc] 6. updated merchant profile:", updated);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[kyc-documents] ERROR:", e);
    return NextResponse.json(
      { error: String(e) },  // expose full error in dev
      { status: 500 }
    );
  }
}
