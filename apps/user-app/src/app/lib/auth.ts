import Credentials from "next-auth/providers/credentials";
import  bcrypt from "bcrypt"
import db from "@repo/db"

export const authOptions = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        phone: {label: "Phone Number", type: "text", placeholder: "123123"},
        email: {label: "email", type: "email"},
        password: {label: "password", type: "password"}
      },
      async authorize(credentials: any){
        const hashedPassword = await bcrypt.hash(credentials.password, 10);
        const existingUser = await db.user.findFirst({
                where: {
                    number: credentials.phone
                }
            });

            if (existingUser) {
                const passwordValidation = await bcrypt.compare(credentials.password, existingUser.password);
                if (passwordValidation) {
                    return {
                        id: existingUser.id.toString(),
                        name: existingUser.name,
                        email: existingUser.number
                    }
                }
                return null;
            }

            try {
                const user = await db.user.create({
                    data: {
                        number: credentials.phone,
                        password: hashedPassword,
                        email: credentials.email
                    }
                });
            
                return {
                    id: user.id.toString(),
                    name: user.name,
                    email: user.number
                }
            } catch(e) {
                console.error(e);
            }
            return null;
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
    }

}