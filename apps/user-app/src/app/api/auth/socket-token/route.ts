import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authSecret } from "../../../lib/authSecret";

function sessionCookieName(): string {
  const useSecure = process.env.NEXTAUTH_URL?.startsWith("https://") === true;
  return useSecure
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

/** Returns the raw NextAuth session JWT for Socket.IO handshake verification. */
export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(sessionCookieName())?.value;

  if (!raw) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await getToken({
    token: raw,
    secret: authSecret(),
  });

  if (!payload?.sub || payload.sessionInvalid === true) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ token: raw });
}
