import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import db, { prismaPlain } from "@repo/db";
import { validateCredentials } from "./credentialsAuth";
import { authSecret } from "./authSecret";
import type { AuthOptions } from "next-auth";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { cookies } from "next/headers";

const useSecureCookies =
  process.env.NEXTAUTH_URL?.startsWith("https://") === true;

const SESSION_MAX_AGE = 8 * 60 * 60;
const SESSION_UPDATE_AGE = 60 * 60;

const SIGNUP_ROLE_COOKIE = "pakpay_signup_role";

function parseSignupRole(value: string | undefined): "USER" | "MERCHANT" {
  return value === "MERCHANT" ? "MERCHANT" : "USER";
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prismaPlain),
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
        sameSite: useSecureCookies ? ("none" as const) : ("lax" as const),
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: useSecureCookies
        ? "__Host-next-auth.csrf-token"
        : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: useSecureCookies ? ("none" as const) : ("lax" as const),
        secure: useSecureCookies,
        path: "/",
      },
    },
    callbackUrl: {
      name: useSecureCookies
        ? "__Secure-next-auth.callback-url"
        : "next-auth.callback-url",
      options: {
        sameSite: useSecureCookies ? ("none" as const) : ("lax" as const),
        secure: useSecureCookies,
        path: "/",
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
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

  events: {
    async createUser({ user }) {
      const userId = Number(user.id);
      if (!Number.isFinite(userId)) return;

      const cookieStore = cookies();
      const role = parseSignupRole(cookieStore.get(SIGNUP_ROLE_COOKIE)?.value);
      const number = `oauth-${userId}-${Date.now()}`;

      await prismaPlain.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            role,
            number,
            emailVerified: new Date(),
          },
        });

        await tx.balance.create({
          data: {
            userId,
            amount: 0,
            locked: 0,
          },
        });

        if (role === "MERCHANT") {
          await tx.merchantProfile.create({
            data: { userId },
          });
        }
      });
    },
    async linkAccount({ user }) {
      const userId = Number(user.id);
      if (!Number.isFinite(userId)) return;

      await prismaPlain.user.update({
        where: { id: userId },
        data: { emailVerified: new Date() },
      });
    },
  },

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: unknown }) {
      if (user) {
        const userId = Number((user as { id: string }).id);
        if (Number.isFinite(userId)) {
          const dbUser = await db.user.findUnique({
            where: { id: userId },
            include: { merchantProfile: { select: { id: true } } },
          });

          if (dbUser) {
            token.role = dbUser.role;
            token.sessionVersion = dbUser.sessionVersion;
            token.merchantId = dbUser.merchantProfile?.id ?? null;
          }
        }
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
