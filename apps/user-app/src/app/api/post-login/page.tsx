"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PostLoginRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;

    if (session.user.role === "MERCHANT") {
      router.replace("/merchant/dashboard");
    } else {
      router.replace("/user/dashboard");
    }
  }, [status, session, router]);

  return null;
}
