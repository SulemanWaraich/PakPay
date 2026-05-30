import Credentials from "next-auth/providers/credentials";
import db from "@repo/db";
import { validateCredentials } from "./credentialsAuth";
import type { ValidatedUser } from "./credentialsAuth";
import { authSecret } from "./authSecret";
import type { AuthOptions } from "next-auth";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

const useSecureCookies =
  process.env.NEXTAUTH_URL?.startsWith("https://") === true;

const SESSION_MAX_AGE = 8 * 60 * 60;
const SESSION_UPDATE_AGE = 60 * 60;

export const authOptions: AuthOptions = {
  secret: authSecret(),
  useSecureCookies,
  session: {
    strategy: "jwt" as const,
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },
  cookies: {
    sessionToken: {
      name: useSecureCookies
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "none" as const,
        path: "/",
        secure: true,
      },
    },
    csrfToken: {
      name: useSecureCookies
        ? "__Host-next-auth.csrf-token"
        : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "none" as const,
        secure: true,
        path: "/",
      },
    },
    callbackUrl: {
      name: useSecureCookies
        ? "__Secure-next-auth.callback-url"
        : "next-auth.callback-url",
      options: {
        sameSite: "none" as const,
        secure: true,
        path: "/",
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
        const result = await validateCredentials(
          credentials?.email ?? "",
          credentials?.password ?? "",
        );
        if (!result.ok) {
          throw new Error(result.message);
        }
        return result.user;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: unknown }) {
      if (user) {
        const u = user as ValidatedUser;
        token.role = u.role;
        token.sessionVersion = u.sessionVersion ?? 0;
        token.merchantId = u.merchantId ?? null;
      }

      const sub = token.sub;
      if (sub) {
        const dbUser = await db.user.findUnique({
          where: { id: Number(sub) },
          select: { sessionVersion: true },
        });

        if (!dbUser) {
          token.sessionInvalid = true;
          return token;
        }

        const tokenVersion =
          typeof token.sessionVersion === "number" ? token.sessionVersion : 0;

        if (dbUser.sessionVersion !== tokenVersion) {
          token.sessionInvalid = true;
        }
      }

      return token;
    },

    async session({
      token,
      session,
    }: {
      token: Record<string, unknown>;
      session: Session;
    }) {
      if (token.sessionInvalid) {
        throw new Error("Session expired. Please sign in again.");
      }

      if (session.user) {
        session.user.id = String(token.sub);
        session.user.role = token.role as "USER" | "MERCHANT" | "ADMIN";
        session.user.merchantId = token.merchantId as number | null | undefined;
      }

      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
};