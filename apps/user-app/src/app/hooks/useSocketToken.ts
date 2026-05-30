"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

/**
 * Fetches the httpOnly NextAuth session JWT for Socket.IO auth.
 * (Client sessions do not expose `session.token` by default.)
 */
export function useSocketToken(): string | null {
  const { status } = useSession();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      setToken(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/socket-token", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setToken(null);
          return;
        }
        const data = (await res.json()) as { token?: string };
        if (!cancelled) {
          setToken(typeof data.token === "string" ? data.token : null);
        }
      } catch {
        if (!cancelled) setToken(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  return token;
}
