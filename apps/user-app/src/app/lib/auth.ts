import Credentials from "next-auth/providers/credentials";
import  bcrypt from "bcryptjs"
import db from "@repo/db"
import { pages } from "next/dist/build/templates/app-page";
import { signIn } from "next-auth/react";

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
               
                return null;
                }

                const passwordValidation = await bcrypt.compare(credentials.password, existingUser.password);
                if (!passwordValidation) {
                    return null
            }

          
            return {
                        id: existingUser.id.toString(),
                        name: existingUser.name,
                        email: existingUser.email
                    };
      }
    })
  ],            
  
   secret: process.env.JWT_SECRET || "secret",
    callbacks: {
        // TODO: can u fix the type here? Using any is bad
        async session({ token, session }: any) {
            session.user.id = token.sub

            return session
        }
    },

    pages: {
        signIn: "/auth/signin",
    },


}