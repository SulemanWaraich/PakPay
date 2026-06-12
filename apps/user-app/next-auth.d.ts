// next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "PENDING" | "USER" | "MERCHANT" | "ADMIN";
      merchantId?: number | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name: string | null;
    email: string | null;
    role: "PENDING" | "ADMIN" | "USER" | "MERCHANT";
    sessionVersion: number;
    merchantId?: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "PENDING" | "ADMIN" | "USER" | "MERCHANT";
    sub: string;
    sessionVersion?: number;
    sessionInvalid?: boolean;
    merchantId?: number | null;
  }
}