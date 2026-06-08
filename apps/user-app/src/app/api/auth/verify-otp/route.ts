import { NextResponse } from "next/server";
import { handleApiError } from "../../../lib/middlewares/errorHandler";
import { rateLimitAllow } from "../../../lib/rateLimitRedis";
import { getClientIp } from "../../../lib/clientIp";
import { jsonError, REGISTER_MESSAGES } from "../../../lib/apiErrors";
import {
  OTP_MAX_ATTEMPTS,
  clearOtp,
  getPendingRegistration,
  getStoredOtp,
  incrementOtpAttempts,
} from "../../../lib/otp";
import { createRegisteredUser } from "../../../lib/registerUser";
import { z } from "zod";

const verifyBodySchema = z.object({
  email: z.string().email(),
  otp: z
    .string()
    .regex(/^\d{6}$/, "Enter the 6-digit verification code"),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ok = await rateLimitAllow(`rl:ip:verify-otp:${ip}`, 10, 10 * 60);
  if (!ok) {
    return jsonError(REGISTER_MESSAGES.RATE_LIMIT, 429);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonError("Invalid request body. Please try again.", 400);
  }

  const parsed = verifyBodySchema.safeParse(json);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.otp?.[0] ??
      parsed.error.flatten().fieldErrors.email?.[0] ??
      "Invalid verification request.";
    return jsonError(msg, 400);
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const submittedOtp = parsed.data.otp.trim();

  try {
    const storedOtp = await getStoredOtp(normalizedEmail);
    if (!storedOtp) {
      return jsonError("Verification code expired or not found. Request a new code.", 400);
    }

    if (storedOtp !== submittedOtp) {
      const attempts = await incrementOtpAttempts(normalizedEmail);
      if (attempts >= OTP_MAX_ATTEMPTS) {
        await clearOtp(normalizedEmail);
        return jsonError("Too many failed attempts. Request a new verification code.", 429);
      }
      return jsonError("Incorrect verification code. Please try again.", 400);
    }

    const pending = await getPendingRegistration(normalizedEmail);
    if (!pending) {
      return jsonError("Registration session expired. Please sign up again.", 400);
    }

    await clearOtp(normalizedEmail);

    const user = await createRegisteredUser({
      email: pending.email,
      number: pending.number,
      password: pending.password,
      name: pending.name,
      role: pending.role,
      emailVerified: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Email verified. Your account was created successfully.",
        userId: user.id,
        role: user.role,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
