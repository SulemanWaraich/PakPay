import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import db from "@repo/db";
import {
  clearLoginFailures,
  isLoginLocked,
  recordLoginFailure,
} from "./loginLockout";

function authSecret(): string {
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

const useSecureCookies =
  process.env.NEXTAUTH_URL?.startsWith("https://") === true;

export const authOptions = {
  secret: authSecret(),
  useSecureCookies,
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: useSecureCookies
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: { email?: string; password?: string } | undefined) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) {
          return null;
        }

        if (await isLoginLocked(email)) {
          return null;
        }

        const existingUser = await db.user.findFirst({
          where: { email },
        });

        if (!existingUser) {
          await new Promise((r) => setTimeout(r, 200));
          return null;
        }

        const passwordValidation = await bcrypt.compare(
          password,
          existingUser.password,
        );
        if (!passwordValidation) {
          await recordLoginFailure(email);
          return null;
        }

        await clearLoginFailures(email);

        return {
          id: existingUser.id.toString(),
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },

    async session({ token, session }: { token: any; session: any }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as "USER" | "MERCHANT" | "ADMIN";
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
};
