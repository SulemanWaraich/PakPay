"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { apiErrorMessage } from "../../lib/apiErrors"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    const trimmed = email.trim()
    if (!trimmed) {
      setError("Enter your email address.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(apiErrorMessage(data, "Could not send reset email. Try again."))
        return
      }

      setSubmitted(true)
      setMessage(
        apiErrorMessage(
          data,
          "If an account exists for this email, we sent a reset link.",
        ),
      )
      setEmail("")
    } catch {
      setError("Network error. Check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card rounded-3xl shadow-lg p-8 md:p-10">
        <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-4">Forgot Password</h1>

        <p className="text-center text-foreground/70 text-sm md:text-base mb-8">
          Enter the email you used for PakPay. We will send a reset link if an account exists.
        </p>

        {message && (
          <div className="mb-6 p-4 bg-accent/10 border border-accent rounded-xl text-accent text-sm text-center">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 w-full px-5 py-3.5 rounded-xl border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
              autoComplete="email"
              required
              aria-label="Email address"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-4 py-3.5 rounded-full bg-green-500 text-secondary-foreground font-medium hover:brightness-105 hover:shadow-pakpay-button transition-all duration-200 whitespace-nowrap disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <Link href="/auth/signin" className="text-sm text-green-600 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
