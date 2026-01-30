// next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "MERCHANT" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name: string | null;
    email: string | null;
    role: "ADMIN" | "USER" | "MERCHANT";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADMIN" | "USER" | "MERCHANT";
    sub: string;
  }
}