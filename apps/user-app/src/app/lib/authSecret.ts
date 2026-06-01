/** Shared NextAuth secret for API routes and middleware. */
export function authSecret(): string {
  const s = process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET;
  if (s && s.length >= 8) {
    return s;
  }
  // Runtime guard only: Docker/Next build has no NEXTAUTH_URL, so no throw at build time.
  if (process.env.NODE_ENV === "production" && process.env.NEXTAUTH_URL) {
    throw new Error(
      "Set NEXTAUTH_SECRET or JWT_SECRET before accepting traffic.",
    );
  }
  return "dev-only-secret-change-in-env-min-32-chars!!";
}
