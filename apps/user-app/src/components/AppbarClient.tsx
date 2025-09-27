"use client"
import { signIn, signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Appbar } from "@repo/ui";

export function AppbarClient(){
  const session = useSession();
  const router = useRouter();

  return <div>
  <Appbar 
    onSignin={signIn}
    user={session.data?.user}
  />
    </div>
}