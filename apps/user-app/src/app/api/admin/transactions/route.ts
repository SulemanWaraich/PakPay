import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "@repo/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await prisma.merchantTransaction.findMany({
      include: {
        merchant: {
          include: { user: { select: { name: true } } }
        },
        customer: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100 // Limit to recent 100 transactions
    });

    return NextResponse.json({ transactions });

  } catch (error) {
    console.error("Admin transactions fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}