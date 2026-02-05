import { NextResponse } from "next/server";
import  prisma  from "@repo/db";
import { nanoid } from "nanoid";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
     const session = await getServerSession(authOptions);
     if (!session?.user?.id) {
      return Response.json({ error: "User not logged in" }, { status: 401 });
    }

    const customerId = session.user.id;

      // ------------------------------
    // 2. Receive payment payload
    // ------------------------------

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
      where: { id: Number(merchantId) },
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

    const id = Number(merchantId)
    // -------------------------------
    // 4. Create a transaction record
    // -------------------------------
    
    // const paymentId = nanoid(12);
    // console.log("Creating payment with ID:", paymentId);


    const payment = await prisma.merchantTransaction.create({
      data: {
        // id: Number(paymentId),
        merchantId: id,
        amount,
        // customerId: Number(customerId),
        paymentMethod: "WALLET",
        ref: ref,
        status: "SUCCESS",
              },
    });

    // -------------------------------
    // 5. Update merchant balance
    // -------------------------------
    await prisma.$transaction([
      prisma.balance.update({
      where: { userId: Number(merchant.userId) },
      data: {
        amount: {
          increment: amount
        },
      },
    }),
    prisma.balance.update({
      where: { userId: Number(customerId) },
      data: {
        amount: {
          decrement: amount
        },
      },
    }),
  ]);

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
