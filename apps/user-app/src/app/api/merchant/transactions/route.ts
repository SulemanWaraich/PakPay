import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import db from "@repo/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // ❌ No session → not logged in
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ❌ Not a merchant
    if (session.user.role !== "MERCHANT") {
      return NextResponse.json(
        { error: "Only merchants can access this resource" },
        { status: 403 }
      );
    }

    // ✔ Get merchant profile
    const merchantProfile = await db.merchantProfile.findFirst({
      where: { userId: Number(session.user.id) },
    });

    if (!merchantProfile) {
      return NextResponse.json(
        { error: "Merchant profile not found" },
        { status: 404 }
      );
    }

    const merchantId = merchantProfile.id;

    // ✔ Fetch merchant transactions
    const payments = await db.merchantTransaction.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        paymentMethod: true,
        status: true,
        ref: true,
        createdAt: true,
        settled: true,
        settledAt: true,
        customer: {
          select: {
            name: true,
            number: true,
          },
        },
      },
    });

    // ✔ Fetch merchant settlements
    const settlements = await db.settlement.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        status: true,
        scheduledFor: true,
        processedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      payments,
      settlements,
    });
  } catch (error) {
    console.error("❌ Error in /api/merchant/transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}