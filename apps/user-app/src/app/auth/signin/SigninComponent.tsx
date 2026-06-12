"use client";
import type React from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import Link from "next/link"
import { signIn } from "next-auth/react";
import { useState } from "react";
import { showToast } from "../../lib/toastMessage";
import { useRouter, useSearchParams  } from "next/navigation";
import { apiErrorMessage } from "../../lib/apiErrors";
import { DemoCredentialsBanner } from "../../../components/DemoCredentialsBanner";
import { AuthDivider, GoogleSignInButton } from "../../../components/GoogleSignInButton";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const reason = searchParams.get("reason");
  const merchantId = searchParams.get("merchantId");
  const callbackUrl = searchParams.get("callbackUrl");

  const messages: Record<string, string> = {
    payment_auth: "Please log in to complete your payment.",
    SessionRequired: "Your session expired. Please sign in again.",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showToast("error", "Enter your email address.");
      return;
    }
    if (!password) {
      showToast("error", "Enter your password.");
      return;
    }

    setSubmitting(true);
    try {
      const check = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const checkData = await check.json().catch(() => ({}));

      if (!check.ok || !checkData.success) {
        showToast(
          "error",
          apiErrorMessage(checkData, "Unable to sign in. Please try again."),
        );
        return;
      }

      const res = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
      });

      if (!res?.ok) {
        showToast(
          "error",
          res?.error && res.error !== "CredentialsSignin"
            ? res.error
            : "Sign-in could not be completed. Please try again.",
        );
        return;
      }

      const session = await fetch("/api/auth/session").then((r) => r.json());

      if (reason === "payment_auth") {
        showToast("success", "Signed in. Redirecting to payment…");
        router.push(`/pay?v=1&type=merchant&mid=${encodeURIComponent(merchantId || "")}`);
        return;
      }

      if (callbackUrl && callbackUrl.startsWith("/")) {
        showToast("success", "Signed in successfully.");
        router.push(callbackUrl);
        return;
      }

      if (session?.user?.role === "ADMIN") {
        showToast("success", "Welcome, Admin.");
        router.push("/admin/dashboard");
        return;
      }

      if (session?.user?.role === "MERCHANT") {
        showToast("success", "Welcome back.");
        router.push("/merchant/dashboard");
        return;
      }

      showToast("success", "Welcome back to PakPay.");
      router.push("/user/dashboard");
    } catch {
      showToast("error", "Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 my-5">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-green-600 mb-6">PakPay</h1>
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">Log in</h2>
          </div>

          {reason && messages[reason] && (
            <div className="rounded-lg bg-yellow-100 border border-yellow-300 p-3 text-sm text-yellow-800 text-center">
              {messages[reason]}
            </div>
          )}

          <DemoCredentialsBanner
            onSelect={(demoEmail, demoPassword) => {
              setEmail(demoEmail);
              setPassword(demoPassword);
            }}
          />

          <GoogleSignInButton
            callbackUrl={
              callbackUrl && callbackUrl.startsWith("/")
                ? callbackUrl
                : reason === "payment_auth" && merchantId
                  ? `/pay?v=1&type=merchant&mid=${encodeURIComponent(merchantId)}`
                  : "/api/post-login"
            }
            disabled={submitting}
          />
          <AuthDivider />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                autoComplete="current-password"
                required
              />
            </div>

          <Link href={'/auth/forgotPass'}>
            <p className="float-right mt-2">
              <span className="text-sm text-green-600 hover:underline">Forgot password?</span>
            </p>
          </Link>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-full text-base font-semibold mt-6"
            >
              {submitting ? "Signing in…" : "Log in"}
            </Button>
          </form>

          <div className="text-center">
            <div className="flex justify-center items-center space-x-2">
              <p>Don't have an account?</p>
            <Link href="/auth/onBoarding">
              <Button
                variant="outline"
                className=" border-green-600 text-green-600 hover:bg-green-50 py-1 rounded-full text-base font-semibold bg-transparent"
              >
                Sign up
              </Button>
            </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
