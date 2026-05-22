import { NextResponse } from "next/server";
import  prisma  from "@repo/db";
import { nanoid } from "nanoid";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { postSignedBankWebhook } from "../../lib/signedBankWebhook";
import { payBodySchema } from "../../lib/validation/schemas";
import { rateLimitAllow } from "../../lib/rateLimitRedis";
import { getClientIp } from "../../lib/clientIp";
import { AUTH_MESSAGES, jsonError, zodErrorMessage } from "../../lib/apiErrors";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return jsonError(AUTH_MESSAGES.NOT_LOGGED_IN, 401);
    }

    const uid = String(session.user.id);
    const ip = getClientIp(req);
    if (
      !(await rateLimitAllow(`rl:user:pay:${uid}`, 40, 60)) ||
      !(await rateLimitAllow(`rl:ip:pay:${ip}`, 120, 60))
    ) {
      return jsonError("Too many payment attempts. Wait a minute and try again.", 429);
    }

    const customerId = session.user.id;

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return jsonError("Invalid payment request.", 400);
    }

    const parsed = payBodySchema.safeParse(json);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error.flatten()), 400);
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
      return jsonError("This merchant is not available for payments.", 404);
    }

    const merchantUserId = merchant.userId; // THE REAL MERCHANT OWNER

     const customerBalance = await prisma.balance.findUnique({
      where: { userId: Number(customerId) }
    });

    if (!customerBalance) {
      return jsonError("Your wallet was not found. Contact support.", 404);
    }

    if (customerBalance.amount < amount) {
      return jsonError(
        "Insufficient wallet balance. Add money to your wallet or use bank transfer.",
        400,
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
    return jsonError("Payment could not be processed. Please try again.", 500);
  }
}
