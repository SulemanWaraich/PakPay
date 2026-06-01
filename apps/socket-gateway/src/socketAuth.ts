import { decode } from "next-auth/jwt";
import prisma from "./prismaClient";

export type VerifiedSocketUser = {
  userId: number;
  role: "USER" | "MERCHANT" | "ADMIN";
};

function authSecret(): string {
  const s = process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET;
  if (s && s.length >= 8) {
    return s;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET or JWT_SECRET must be set");
  }
  return "dev-only-secret-change-in-env-min-32-chars!!";
}

export async function verifySocketToken(
  token: string,
): Promise<VerifiedSocketUser | null> {
  let payload: Record<string, unknown> | null = null;

  try {
    payload = (await decode({
      token,
      secret: authSecret(),
    })) as Record<string, unknown> | null;
  } catch {
    return null;
  }

  if (!payload?.sub || payload.sessionInvalid === true) {
    return null;
  }

  const userId = Number(payload.sub);
  if (!Number.isFinite(userId)) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionVersion: true, role: true },
  });

  if (!dbUser) {
    return null;
  }

  const tokenVersion =
    typeof payload.sessionVersion === "number" ? payload.sessionVersion : 0;

  if (dbUser.sessionVersion !== tokenVersion) {
    return null;
  }

  const roleFromToken = payload.role;
  const role =
    roleFromToken === "USER" ||
    roleFromToken === "MERCHANT" ||
    roleFromToken === "ADMIN"
      ? roleFromToken
      : dbUser.role;

  return { userId, role };
}

/** Returns merchant owner's user id if profile exists and belongs to user. */
export async function verifyMerchantRoomAccess(
  merchantProfileId: number,
  userId: number,
): Promise<number | null> {
  const profile = await prisma.merchantProfile.findFirst({
    where: {
      id: merchantProfileId,
      userId,
    },
    select: { userId: true },
  });

  return profile?.userId ?? null;
}
