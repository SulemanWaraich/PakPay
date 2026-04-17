import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@repo/db";
import { authOptions } from "../../lib/auth";
import { postSignedBankWebhook } from "../../lib/signedBankWebhook";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { amount?: unknown; token?: unknown; userId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = Number(body.userId);
  if (!Number.isFinite(userId) || userId !== Number(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = String(body.token ?? "");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const txn = await prisma.offRampTransaction.findFirst({
    where: { token, userId },
  });
  if (!txn) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  try {
    await postSignedBankWebhook("withdrawWebHook", {
      amount: Number(body.amount ?? txn.amount),
      token,
      user_identifier: userId,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Webhook failed" },
      { status: 502 },
    );
  }
}
