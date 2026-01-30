"use client"
import type React from "react"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get("token")


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password === confirmPassword && password.length > 0) {
      // UI-only implementation
      setSubmitted(true)

    const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  })

  if (res.ok) {
    setSubmitted(true)
    setTimeout(() => router.push("/auth/signin"), 2000)
  }


    }
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 relative  overflow-hidden shadow-lg  ">
      
      {/* Centered Card */}
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-8 md:p-10">

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Reset Your Password</h1>

        {/* Description */}
        <p className="text-foreground/70 text-sm md:text-base mb-8">Enter your new password below.</p>

        {/* Success Message */}
        {submitted && (
          <div className="mb-6 p-4 bg-accent/10 border border-accent rounded-2xl text-accent text-sm text-center font-medium">
            Password reset successfully!
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password Input */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 rounded-full border-2 border-mint-light bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
              required
              aria-label="New password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Confirm Password Input */}
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-5 py-3.5 rounded-full border-2 border-mint-light bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
              required
              aria-label="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle confirm password visibility"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Reset Button */}
          <button
            type="submit"
            disabled={!password || !confirmPassword}
            className="w-full px-6 py-3.5 rounded-full bg-green-500 text-white font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Reset
          </button>
        </form>
      </div>
    </div>
  )
}
