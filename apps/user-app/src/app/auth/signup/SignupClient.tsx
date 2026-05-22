"use client";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { showToast } from "../../lib/toastMessage";
import { apiErrorMessage } from "../../lib/apiErrors";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") as "USER" | "MERCHANT";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!role) {
      showToast("warning", "Choose whether you are signing up as a User or Merchant.");
      router.push("/api/selector");
      return;
    }

    if (!name.trim()) {
      showToast("error", "Enter your full name.");
      return;
    }
    if (!email.trim()) {
      showToast("error", "Enter your email address.");
      return;
    }
    if (!number.trim()) {
      showToast("error", "Enter your phone number (10–15 digits).");
      return;
    }
    if (!password) {
      showToast("error", "Choose a password (at least 8 characters).");
      return;
    }
    if (password.length < 8) {
      showToast("error", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      showToast("error", "Passwords do not match. Re-enter confirm password.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          number: number.trim(),
          password,
          name: name.trim(),
          role,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast(
          "error",
          apiErrorMessage(data, "Registration failed. Please try again."),
        );
        return;
      }

      showToast("success", "Account created. Signing you in…");

      const loginRes = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (loginRes?.ok) {
        showToast("success", "Welcome to PakPay.");
        router.push("/api/post-login");
      } else {
        showToast(
          "info",
          "Account created. Please sign in with your email and password.",
        );
        router.push("/auth/signin");
      }
    } catch {
      showToast("error", "Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">

          <div className="text-center">
            <h1 className="text-3xl font-bold text-green-600 mb-6">PakPay</h1>
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">
              Sign up as {role === "MERCHANT" ? "Merchant" : "User"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              autoComplete="name"
              required
            />

            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              autoComplete="email"
              required
            />

            <Input
              type="tel"
              placeholder="Phone number (e.g. 03001234567)"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              autoComplete="tel"
              required
            />

            <Input
              type="password"
              placeholder="Password (min. 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              autoComplete="new-password"
              required
            />

            <Input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold mt-6"
            >
              {submitting ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <div className="text-center">
            <div className="flex justify-center items-center space-x-2">
              <p>Already have an account?</p>
              <Link href="/auth/signin">
                <Button
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50 py-1 rounded-full"
                >
                  Log in
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
