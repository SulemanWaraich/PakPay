import { NextResponse } from "next/server";
import  prisma  from "@repo/db";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { merchantId, amount, ref } = await req.json();

    // -------------------------------
    // 1. Basic validation
    // -------------------------------
    if (!merchantId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment request" }, { status: 400 });
    }

    // -------------------------------
    // 2. Merchant existence check
    // -------------------------------
    const merchant = await prisma.merchantProfile.findUnique({
      where: { id: Number(merchantId) }
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
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

    const id = Number(merchantId)
    // -------------------------------
    // 4. Create a transaction record
    // -------------------------------
    const paymentId = nanoid(12);
    console.log("Creating payment with ID:", paymentId);
    const payment = await prisma.merchantTransaction.create({
      data: {
        id: Number(paymentId),
        merchantId: id,
        amount,
        paymentMethod: "WALLET",
        ref: ref || `ref_${nanoid(8)}`,
        status: "SUCCESS",
              },
    });

    // -------------------------------
    // 5. Update merchant balance
    // -------------------------------
    await prisma.balance.update({
      where: { id: Number(merchantId) },
      data: {
        amount: {
          increment: amount
        },
      },
    });

    // -------------------------------
    // 6. Return success
    // -------------------------------
    return NextResponse.json({
      success: true,
      paymentId,
      payment,
      message: "Payment successful",
    });

  } catch (error: any) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
