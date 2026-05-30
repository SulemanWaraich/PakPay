import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@repo/db";
import { resetPasswordBodySchema } from "../../../lib/validation/schemas";
import { jsonError, zodErrorMessage } from "../../../lib/apiErrors";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonError("Invalid request. Please try again from the reset link.", 400);
  }

  const parsed = resetPasswordBodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(zodErrorMessage(parsed.error.flatten()), 400);
  }

  const { token, password } = parsed.data;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      resetTokenHash: tokenHash,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return jsonError(
      "This reset link is invalid or has expired. Request a new link from Forgot Password.",
      400,
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetTokenHash: null,
      resetTokenExpiry: null,
      sessionVersion: { increment: 1 },
    },
  });

  return NextResponse.json({
    success: true,
    message: "Your password was updated. You can sign in now.",
  });
}
