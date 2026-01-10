"use client";
import type React from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import Link from "next/link"
import { signIn } from "next-auth/react";
import { useState } from "react";
import { showToast } from "../../lib/toastMessage";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
       try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.ok) {
        showToast("success", "Welcome back to PakPay! Redirecting to dashboard...");
        router.push("/dashboard");
      } else {
        showToast("error", "Invalid email or password. Please try again.");
      }
    } catch (error) {
      showToast("error", "Something went wrong. Please try again later.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Logo */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-green-600 mb-6">PakPay</h1>
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">Log in</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                required
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
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
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-full text-base font-semibold mt-6"
            >
              Log in
            </Button>
          </form>

          {/* Sign up link */}
          <div className="text-center">
            <div className="flex justify-center items-center space-x-2">
              <p>Don't have an account?</p>
            <Link href="/auth/signup">
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
