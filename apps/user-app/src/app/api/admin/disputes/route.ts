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

    const disputes = await prisma.dispute.findMany({
      include: {
        user: { select: { name: true, email: true } },
        transaction: {
          include: {
            merchant: {
              include: { user: { select: { name: true } } }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ disputes });

  } catch (error) {
    console.error("Admin disputes fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { disputeId, action, notes } = await req.json();

    if (!disputeId || !action) {
      return NextResponse.json(
        { error: "Dispute ID and action are required" },
        { status: 400 }
      );
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: parseInt(disputeId) }
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    let newStatus: string;
    switch (action) {
      case "RESOLVE":
        newStatus = "RESOLVED";
        break;
      case "REJECT":
        newStatus = "REJECTED";
        break;
      case "REVIEW":
        newStatus = "UNDER_REVIEW";
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await prisma.dispute.update({
      where: { id: parseInt(disputeId) },
      data: {
        status: newStatus,
        resolvedAt: action === "RESOLVE" || action === "REJECT" ? new Date() : null,
        adminNotes: notes
      }
    });

    return NextResponse.json({ message: "Dispute updated successfully" });

  } catch (error) {
    console.error("Admin dispute update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}