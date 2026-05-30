import { NextResponse } from "next/server";
import prisma from "@repo/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { nanoid } from "nanoid";
import { rateLimitAllow } from "../../lib/rateLimitRedis";
import { getClientIp } from "../../lib/clientIp";
import { createOffRampSchema } from "../../lib/validation/schemas";
import { AUTH_MESSAGES, jsonError, zodErrorMessage } from "../../lib/apiErrors";
import { pkrToPaisa, withAmountInPkr } from "../../lib/money";
import { lockFundsForOffRamp } from "../../lib/balanceLocks";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonError(AUTH_MESSAGES.NOT_LOGGED_IN, 401);
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
    return jsonError("Invalid request. Please try again.", 400);
  }

  const parsed = createOffRampSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(zodErrorMessage(parsed.error.flatten()), 400);
  }

  const { amount: amountPkr, bank, accountHolderName, bankName, accountNumber, branch } =
    parsed.data;
  const amountPaisa = pkrToPaisa(amountPkr);
  const legacyBank = bank ?? bankName;

  const userId = Number(session.user.id);

  try {
    const token = nanoid(16);
    const transaction = await prisma.$transaction(async (tx) => {
      await lockFundsForOffRamp(tx, userId, amountPaisa);
      return tx.offRampTransaction.create({
        data: {
          amount: amountPaisa,
          bankAccount: legacyBank,
          accountHolderName,
          bankName,
          accountNumber,
          branch: branch ?? null,
          status: "Processing",
          startTime: new Date(),
          token,
          userId,
        },
      });
    });

    return NextResponse.json({ success: true, transaction: withAmountInPkr(transaction) });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "INSUFFICIENT") {
      return jsonError("Insufficient wallet balance for this withdrawal.", 400);
    }
    if (msg === "NO_BALANCE") {
      return jsonError("Your wallet was not found. Contact support.", 404);
    }
    console.error("create-offramp error:", error);
    return jsonError("Failed to create offramp", 500);
  }
}
