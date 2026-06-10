"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { showToast } from "../../lib/toastMessage";
import { apiErrorMessage } from "../../lib/apiErrors";

const PENDING_REGISTRATION_KEY = "pakpay_pending_registration";

type PendingRegistration = {
  email: string;
  number: string;
  password: string;
  name: string;
  role: "USER" | "MERCHANT";
};

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email")?.trim().toLowerCase() ?? "";

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const readPendingRegistration = (): PendingRegistration | null => {
    try {
      const raw = sessionStorage.getItem(PENDING_REGISTRATION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PendingRegistration;
    } catch {
      return null;
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      showToast("error", "Email address is missing. Please sign up again.");
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      showToast("error", "Enter the 6-digit verification code.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, otp: otp.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast("error", apiErrorMessage(data, "Verification failed. Please try again."));
        return;
      }

      const pending = readPendingRegistration();
      const password = pending?.password;
      if (!password) {
        showToast(
          "info",
          "Email verified. Please sign in with your email and password.",
        );
        sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
        router.push("/auth/signin");
        return;
      }

      const loginRes = await signIn("credentials", {
        redirect: false,
        email: normalizedEmail,
        password,
      });

      sessionStorage.removeItem(PENDING_REGISTRATION_KEY);

      if (loginRes?.ok) {
        showToast("success", "Welcome to PakPay.");
        router.push("/api/post-login");
        return;
      }

      showToast("success", "Email verified. Please sign in.");
      router.push("/auth/signin");
    } catch {
      showToast("error", "Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resending || cooldown > 0) return;

    const pending = readPendingRegistration();
    if (!pending) {
      showToast("error", "Registration session expired. Please sign up again.");
      router.push("/auth/onBoarding");
      return;
    }

    setResending(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast("error", apiErrorMessage(data, "Could not resend code. Please try again."));
        return;
      }

      setCooldown(60);
      showToast("success", "A new verification code was sent to your email.");
    } catch {
      showToast("error", "Network error. Check your connection and try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-green-600 mb-6">PakPay</h1>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Verify your email</h2>
            <p className="text-sm text-gray-600">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-gray-900">{email || "your email"}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 text-center tracking-[0.4em] text-lg"
              autoComplete="one-time-code"
              required
            />

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold"
            >
              {submitting ? "Verifying…" : "Verify"}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <Button
              type="button"
              variant="outline"
              disabled={resending || cooldown > 0}
              onClick={() => void handleResend()}
              className="border-green-600 text-green-600 hover:bg-green-50 rounded-full"
            >
              {cooldown > 0
                ? `Resend code in ${cooldown}s`
                : resending
                  ? "Sending…"
                  : "Resend Code"}
            </Button>
            <p className="text-sm text-gray-600">
              Wrong email?{" "}
              <Link href="/auth/onBoarding" className="text-green-600 hover:underline">
                Start over
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
