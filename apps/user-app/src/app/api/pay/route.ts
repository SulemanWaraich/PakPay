import { NextResponse } from "next/server";
import  prisma  from "@repo/db";
import { nanoid } from "nanoid";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { postSignedBankWebhook } from "../../lib/signedBankWebhook";
import { payBodySchema } from "../../lib/validation/schemas";
import { rateLimitAllow } from "../../lib/rateLimitRedis";
import { getClientIp } from "../../lib/clientIp";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "User not logged in" }, { status: 401 });
    }

    const uid = String(session.user.id);
    const ip = getClientIp(req);
    if (
      !(await rateLimitAllow(`rl:user:pay:${uid}`, 40, 60)) ||
      !(await rateLimitAllow(`rl:ip:pay:${ip}`, 120, 60))
    ) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const customerId = session.user.id;

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = payBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payment request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { merchantId: midRaw, amount, ref, paymentMethod } = parsed.data;
    const merchantId =
      typeof midRaw === "number" ? midRaw : Number.parseInt(String(midRaw), 10);

    // -------------------------------
    // 2. Merchant existence check
    // -------------------------------
    const merchant = await prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      include: { user: true }

    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const merchantUserId = merchant.userId; // THE REAL MERCHANT OWNER

     const customerBalance = await prisma.balance.findUnique({
      where: { userId: Number(customerId) }
    });

    if (!customerBalance) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    if (customerBalance.amount < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }
    
  

    // -------------------------------
    // 3. Prevent duplicate payment from QR (if ref exists)
    // -------------------------------
    if (ref) {
      const existing = await prisma.merchantTransaction.findUnique({
        where: { ref }
      });

      if (existing) {
        return NextResponse.json({
          success: true,
          message: "Payment already processed",
          payment: existing
        });
      }
    }

    const id = merchantId;
    // -------------------------------
    // 4. Create a transaction record
    // -------------------------------
    
    // const paymentId = nanoid(12);
    // console.log("Creating payment with ID:", paymentId);


    const paymentRef =
      ref && String(ref).trim().length > 0 ? String(ref).trim() : nanoid(16);

    const payment = await prisma.merchantTransaction.create({
      data: {
        merchantId: id,
        amount,
        customerId: Number(customerId),
        paymentMethod,
        ref: paymentRef,
        status: "PENDING",
      },
    });

    await postSignedBankWebhook("merchantWebHook", {
      amount,
      merchantId: merchant.userId,
      customerId: Number(customerId),
      token: paymentRef,
    });

    // -------------------------------
    // 6. Return success
    // -------------------------------
    return NextResponse.json({
      success: true,
      payment,
      message: "Payment successful",
    });

  } catch (error: any) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
