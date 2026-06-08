import { NextResponse } from "next/server";
import db from "@repo/db";
import { handleApiError } from "../../../lib/middlewares/errorHandler";
import { rateLimitAllow } from "../../../lib/rateLimitRedis";
import { getClientIp } from "../../../lib/clientIp";
import { registerBodySchema } from "../../../lib/validation/schemas";
import { jsonError, REGISTER_MESSAGES, zodErrorMessage } from "../../../lib/apiErrors";
import { sendOtpEmail } from "../../../lib/email";
import {
  generateOtp,
  isResendOnCooldown,
  setResendCooldown,
  storeOtp,
} from "../../../lib/otp";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ok = await rateLimitAllow(`rl:ip:send-otp:${ip}`, 5, 10 * 60);
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

  if (await isResendOnCooldown(normalizedEmail)) {
    return jsonError("Please wait 60 seconds before requesting a new code.", 429);
  }

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

    const otp = generateOtp();
    await storeOtp(normalizedEmail, otp, {
      email: normalizedEmail,
      number,
      password,
      name,
      role,
    });
    await sendOtpEmail(normalizedEmail, otp);
    await setResendCooldown(normalizedEmail);

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email.",
      email: normalizedEmail,
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
