import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@repo/db";
import { sendResetEmail } from "../../../lib/mailer";
import { forgotPasswordBodySchema } from "../../../lib/validation/schemas";
import { jsonError, zodErrorMessage } from "../../../lib/apiErrors";

const SUCCESS_MESSAGE =
  "If an account exists for this email, we sent a password reset link. Check your inbox and spam folder.";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonError("Invalid request. Enter your email and try again.", 400);
  }

  const parsed = forgotPasswordBodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(zodErrorMessage(parsed.error.flatten()), 400);
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ success: true, message: SUCCESS_MESSAGE });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  await prisma.user.update({
    where: { email },
    data: {
      resetTokenHash: tokenHash,
      resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const resetLink = `${process.env.NEXTAUTH_URL}/auth/resetPass?token=${token}`;

  try {
    await sendResetEmail(email, resetLink);
  } catch (e) {
    console.error("[forgot-password] email failed:", e);
    return jsonError(
      "We could not send the reset email. Try again later or contact support.",
      500,
    );
  }

  return NextResponse.json({ success: true, message: SUCCESS_MESSAGE });
}
