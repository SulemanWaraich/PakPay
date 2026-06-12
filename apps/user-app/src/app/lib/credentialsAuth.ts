import bcrypt from "bcryptjs";
import db from "@repo/db";
import { AUTH_MESSAGES } from "./apiErrors";
import {
  clearLoginFailures,
  isLoginLocked,
  recordLoginFailure,
} from "./loginLockout";

export type ValidatedUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: "PENDING" | "USER" | "MERCHANT" | "ADMIN";
  sessionVersion: number;
  merchantId: number | null;
};

export type CredentialResult =
  | { ok: true; user: ValidatedUser }
  | { ok: false; message: string };

export async function validateCredentials(
  emailRaw: string,
  password: string,
): Promise<CredentialResult> {
  const email = emailRaw.trim().toLowerCase();

  if (!email && !password) {
    return { ok: false, message: AUTH_MESSAGES.MISSING_FIELDS };
  }
  if (!email) {
    return { ok: false, message: AUTH_MESSAGES.MISSING_EMAIL };
  }
  if (!password) {
    return { ok: false, message: AUTH_MESSAGES.MISSING_PASSWORD };
  }
  if (await isLoginLocked(email)) {
    return { ok: false, message: AUTH_MESSAGES.LOCKED };
  }

  const existingUser = await db.user.findFirst({
    where: { email },
    include: { merchantProfile: { select: { id: true } } },
  });

  if (!existingUser) {
    await new Promise((r) => setTimeout(r, 200));
    return { ok: false, message: AUTH_MESSAGES.INVALID_CREDENTIALS };
  }

  if (!existingUser.password) {
    return {
      ok: false,
      message: "This account uses Google sign-in. Click Continue with Google.",
    };
  }

  const passwordValid = await bcrypt.compare(password, existingUser.password);
  if (!passwordValid) {
    await recordLoginFailure(email);
    return { ok: false, message: AUTH_MESSAGES.INVALID_CREDENTIALS };
  }

  await clearLoginFailures(email);

  return {
    ok: true,
    user: {
      id: existingUser.id.toString(),
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      sessionVersion: existingUser.sessionVersion,
      merchantId: existingUser.merchantProfile?.id ?? null,
    },
  };
}