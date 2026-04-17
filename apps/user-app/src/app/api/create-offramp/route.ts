import { NextResponse } from "next/server";
import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { nanoid } from "nanoid";
import { rateLimitAllow } from "../../lib/rateLimitRedis";
import { getClientIp } from "../../lib/clientIp";
import { createOffRampSchema } from "../../lib/validation/schemas";
import { jsonError } from "../../lib/apiErrors";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonError("User not logged in", 401);
  }

  const uid = String(session.user.id);
  const ip = getClientIp(req);
  const okUser = await rateLimitAllow(`rl:user:create-offramp:${uid}`, 20, 60);
  const okIp = await rateLimitAllow(`rl:ip:create-offramp:${ip}`, 50, 60);
  if (!okUser || !okIp) {
    return jsonError("Too many requests. Try again later.", 429);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = createOffRampSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { amount, bank, accountHolderName, bankName, accountNumber, branch } =
    parsed.data;
  const legacyBank = bank ?? bankName;

  try {
    const token = nanoid(16);
    const transaction = await prisma.offRampTransaction.create({
      data: {
        amount,
        bankAccount: legacyBank,
        accountHolderName,
        bankName,
        accountNumber,
        branch: branch ?? null,
        status: "Processing",
        startTime: new Date(),
        token,
        userId: Number(session.user.id),
      },
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error("create-offramp error:", error);
    return jsonError("Failed to create offramp", 500);
  }
}
