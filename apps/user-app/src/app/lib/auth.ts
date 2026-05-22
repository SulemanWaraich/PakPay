import Credentials from "next-auth/providers/credentials";
import { validateCredentials } from "./credentialsAuth";
import { authSecret } from "./authSecret";

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
        sameSite: "none" as const,   // ← changed from "lax"
        path: "/",
        secure: true,                // ← always true (required for SameSite=none)
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