import { NextResponse } from "next/server";
import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { z } from "zod";

const createSchema = z.object({
  merchantTransactionId: z.number().int().positive(),
  reason: z.string().min(5).max(2000),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.dispute.findMany({
    where: { userId: Number(session.user.id) },
    orderBy: { createdAt: "desc" },
    include: {
      MerchantTransaction: {
        select: { id: true, amount: true, status: true, createdAt: true },
      },
    },
  });

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { merchantTransactionId, reason } = parsed.data;

  const txn = await prisma.merchantTransaction.findFirst({
    where: {
      id: merchantTransactionId,
      customerId: Number(session.user.id),
      status: "SUCCESS",
    },
  });

  if (!txn) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (txn.refunded) {
    return NextResponse.json({ error: "Already refunded" }, { status: 400 });
  }

  try {
    const dispute = await prisma.dispute.create({
      data: {
        transactionId: merchantTransactionId,
        userId: Number(session.user.id),
        reason,
        status: "PENDING",
      },
    });
    return NextResponse.json(dispute, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Dispute already exists or could not be created" },
      { status: 409 },
    );
  }
}
