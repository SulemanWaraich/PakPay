// next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "MERCHANT";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "USER" | "MERCHANT";
  }
}
