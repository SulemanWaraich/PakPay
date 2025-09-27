"use client";

import { Button } from "./Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface AppbarProps {
  user?: {
    name?: string | null;
  };
  onSignin: () => void;
}

export const Appbar = ({ user, onSignin }: AppbarProps) => {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false }); // logout but don't auto-redirect
    router.push("/");                   // redirect to landing page
    router.refresh();                   // refresh session state in UI
  };

  return (
    <div className="flex justify-between border-b px-4   bg-white text-black">
      <div className="sm:text-3xl text-2xl  font-bold text-green-600 mt-2">
        <Link href={"/"}> PakPay </Link>
      </div>
      <div className="flex flex-col justify-center pt-2">
        <Button onClick={user ? handleLogout : onSignin}>
          {user ? "Logout" : "Login"}
        </Button>
      </div>
    </div>
  );
};
