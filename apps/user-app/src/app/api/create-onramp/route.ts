import { NextResponse } from "next/server";
import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { nanoid } from "nanoid";
import { rateLimitAllow } from "../../lib/rateLimitRedis";
import { getClientIp } from "../../lib/clientIp";
import { createOnRampSchema } from "../../lib/validation/schemas";
import { jsonError } from "../../lib/apiErrors";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonError("User not logged in", 401);
  }

  const uid = String(session.user.id);
  const ip = getClientIp(req);
  const okUser = await rateLimitAllow(`rl:user:create-onramp:${uid}`, 25, 60);
  const okIp = await rateLimitAllow(`rl:ip:create-onramp:${ip}`, 60, 60);
  if (!okUser || !okIp) {
    return jsonError("Too many requests. Try again later.", 429);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = createOnRampSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { amount, bank } = parsed.data;

  try {
    const token = nanoid(16);
    const transaction = await prisma.onRampTransaction.create({
      data: {
        amount,
        provider: bank,
        status: "Processing",
        startTime: new Date(),
        token,
        userId: Number(session.user.id),
      },
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error("create-onramp error:", error);
    return jsonError("Failed to create onramp", 500);
  }
}
