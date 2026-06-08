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
      <div className="mt-2">
        <Link href={"/"} className="flex items-center gap-2">
          <img
            src="/pakpay-logo.png"
            alt="PakPay"
            width={120}
            height={40}
            className="h-8 w-auto object-contain"
          />
          <span className="text-xl font-bold">PakPay</span>
        </Link>
      </div>
      <div className="flex flex-col justify-center pt-2">
        <Button onClick={user ? handleLogout : onSignin}>
          {user ? "Logout" : "Login"}
        </Button>
      </div>
    </div>
  );
};
