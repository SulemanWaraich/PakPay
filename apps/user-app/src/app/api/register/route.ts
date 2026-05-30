import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@repo/db";
import { handleApiError } from "../../lib/middlewares/errorHandler";
import { rateLimitAllow } from "../../lib/rateLimitRedis";
import { getClientIp } from "../../lib/clientIp";
import { registerBodySchema } from "../../lib/validation/schemas";
import { jsonError, REGISTER_MESSAGES, zodErrorMessage } from "../../lib/apiErrors";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ok = await rateLimitAllow(`rl:ip:register:${ip}`, 5, 10 * 60);
  if (!ok) {
    return jsonError(REGISTER_MESSAGES.RATE_LIMIT, 429);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonError("Invalid request body. Please try again.", 400);
  }

  const parsed = registerBodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(zodErrorMessage(parsed.error.flatten()), 400);
  }

  const { email, number, password, name, role } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const [byEmail, byNumber] = await Promise.all([
      db.user.findFirst({ where: { email: normalizedEmail } }),
      db.user.findFirst({ where: { number } }),
    ]);

    if (byEmail) {
      return jsonError(REGISTER_MESSAGES.DUPLICATE_EMAIL, 400);
    }
    if (byNumber) {
      return jsonError(REGISTER_MESSAGES.DUPLICATE_PHONE, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          number,
          password: hashedPassword,
          role,
        },
      });

      await tx.balance.create({
        data: {
          userId: user.id,
          amount: 0,
          locked: 0,
        },
      });

      if (role === "MERCHANT") {
        await tx.merchantProfile.create({
          data: {
            userId: user.id,
          },
        });
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your account was created successfully.",
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
