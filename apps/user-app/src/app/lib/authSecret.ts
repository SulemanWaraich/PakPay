/** Shared NextAuth secret for API routes and middleware. */
export function authSecret(): string {
  const s = process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET;
  if (s && s.length >= 8) {
    return s;
  }
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[auth] Set NEXTAUTH_SECRET or JWT_SECRET (min 8 chars) before accepting traffic.",
    );
  }
  return "dev-only-secret-change-in-env-min-32-chars!!";
}
