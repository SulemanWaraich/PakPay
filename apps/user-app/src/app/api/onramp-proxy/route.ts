import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@repo/db";
import { authOptions } from "../../lib/auth";
import { postSignedBankWebhook } from "../../lib/signedBankWebhook";
import { rateLimitAllow } from "../../lib/rateLimitRedis";
import { getClientIp } from "../../lib/clientIp";
import { jsonError } from "../../lib/apiErrors";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uid = String(session.user.id);
  const ip = getClientIp(req);
  const okUser = await rateLimitAllow(`rl:user:onramp-proxy:${uid}`, 25, 60);
  const okIp = await rateLimitAllow(`rl:ip:onramp-proxy:${ip}`, 60, 60);
  if (!okUser || !okIp) {
    return jsonError("Too many requests. Try again later.", 429);
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

  const txn = await prisma.onRampTransaction.findFirst({
    where: { token, userId },
  });
  if (!txn) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  try {
    await postSignedBankWebhook("hdfcWebHook", {
      amount: txn.amount,
      token,
      userId,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Webhook failed" },
      { status: 502 },
    );
  }
}
