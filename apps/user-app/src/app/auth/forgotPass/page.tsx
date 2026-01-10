"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault()
    // UI-only implementation
    setSubmitted(true)

    await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })

  setEmail("")
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
    
      {/* Centered Card */}
      <div className="w-full max-w-lg bg-card rounded-3xl shadow-lg p-8 md:p-10">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-4">Forgot Password</h1>

        {/* Description */}
        <p className="text-center text-foreground/70 text-sm md:text-base mb-8">
          Enter your email address to reset your password.
        </p>

        {/* Success Message */}
        {submitted && (
          <div className="mb-6 p-4 bg-accent/10 border border-accent rounded-xl text-accent text-sm text-center">
            Reset link sent! Check your email.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 w-full px-5 py-3.5 rounded-xl border border-input  text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
            required
            aria-label="Email address"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-3.5 rounded-full bg-green-500 text-secondary-foreground font-medium hover:brightness-105 hover:shadow-pakpay-button transition-all duration-200 whitespace-nowrap"
          >
            Send reset link
          </button>
        </div>
        </form>

        {/* Back to Login Link */}
        <div className="mt-8 text-center">
          <Link href="/auth/signin" className="text-sm text-green-600 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
