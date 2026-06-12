"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"

export default function RelayPage() {
  const { data: session, status, update } = useSession()

  useEffect(() => {
    if (status === "loading") return

    const interval = setInterval(async () => {
      await update()
    }, 1000)

    return () => clearInterval(interval)
  }, [status, update])

  useEffect(() => {
    if (status !== "authenticated") return
    if (!session?.user?.role || session.user.role === "PENDING") return

    clearInterval
    if (session.user.role === "MERCHANT") {
      window.location.href = "/merchant/dashboard"
    } else {
      window.location.href = "/user/dashboard"
    }
  }, [status, session])

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-8 py-6 shadow-md">

      {/* Spinner */}
      <div className="h-10 w-10 rounded-full border-4 border-muted border-t-green-600 animate-spin" />

      {/* Text */}
      <p className="text-sm font-medium text-muted-foreground">
        Setting Up Your Account…
      </p>
    </div>
  </div>
  )
}