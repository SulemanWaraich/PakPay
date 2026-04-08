import Credentials from "next-auth/providers/credentials";
import  bcrypt from "bcryptjs"
import db from "@repo/db"
import { pages } from "next/dist/build/templates/app-page";
import { signIn } from "next-auth/react";
import { LRUCache } from "lru-cache";

const failedLoginAttempts = new LRUCache({
  max: 1000, // store up to 1000 users
  ttl: 15 * 60 * 1000, // 15 minutes window
});


export const authOptions = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: {label: "Email", type: "email"},
        password: {label: "Password", type: "password"}
      },
      async authorize(credentials: any){
        const existingUser = await db.user.findFirst({
                where: {
                    email: credentials.email
                }
            });

            if (!existingUser) {
                // Increment failed attempts for unknown email too
                const key = `login-${credentials.email}`;
                const attempts: any = failedLoginAttempts.get(key) || 0;
                failedLoginAttempts.set(key, attempts + 1);
                return null;
                }

                // Check if account is locked
                const key = `login-${existingUser.email}`;
                const attempts: any = failedLoginAttempts.get(key) || 0;
                if (attempts >= 5) {
                    throw new Error("Account locked due to too many failed login attempts. Try again in 15 minutes.");
                }

                const passwordValidation = await bcrypt.compare(credentials.password, existingUser.password);
                if (!passwordValidation) {
                    failedLoginAttempts.set(key, attempts + 1);
                    return null
            }

            // Reset failed attempts on successful login
            failedLoginAttempts.delete(key);
          
            return {
                        id: existingUser.id.toString(),
                        name: existingUser.name,
                        email: existingUser.email,
                        role: existingUser.role,
                    };
      }
    })
  ],            
  
   secret: process.env.JWT_SECRET || "secret",
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
            token.role = user.role; // store role in JWT
            }
            return token;
        },

        // TODO: can u fix the type here? Using any is bad
        async session({ token, session }: any) {
         if (session.user) {
      session.user.id = token.sub!;
      session.user.role = token.role as "USER" | "MERCHANT" | "ADMIN";
    }
    return session;
    }
    },
    
    pages: {
        signIn: "/auth/signin",
    },


}