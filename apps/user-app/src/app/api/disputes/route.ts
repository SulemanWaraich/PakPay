import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import prisma from "@repo/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionId, reason, description } = await req.json();

    if (!transactionId || !reason) {
      return NextResponse.json(
        { error: "Transaction ID and reason are required" },
        { status: 400 }
      );
    }

    // Verify the transaction exists and belongs to the user
    const transaction = await prisma.merchantTransaction.findUnique({
      where: { id: parseInt(transactionId) },
      include: { customer: true, merchant: true }
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Check if user is involved in this transaction
    const userId = parseInt(session.user.id);
    if (transaction.customerId !== userId && transaction.merchant.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if dispute already exists
    const existingDispute = await prisma.dispute.findFirst({
      where: { transactionId: parseInt(transactionId), userId }
    });

    if (existingDispute) {
      return NextResponse.json({ error: "Dispute already filed for this transaction" }, { status: 400 });
    }

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        transactionId: parseInt(transactionId),
        userId,
        reason,
        description
      }
    });

    return NextResponse.json({
      message: "Dispute filed successfully",
      dispute
    });

  } catch (error) {
    console.error("Dispute creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const disputes = await prisma.dispute.findMany({
      where: { userId },
      include: {
        transaction: {
          include: {
            merchant: {
              include: { user: true }
            },
            customer: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ disputes });

  } catch (error) {
    console.error("Disputes fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}