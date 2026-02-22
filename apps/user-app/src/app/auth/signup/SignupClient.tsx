"use client";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { showToast } from "../../lib/toastMessage";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // ✅ NEW FIELD

  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") as "USER" | "MERCHANT";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!role) {
      router.push("/auth/role-select");
      return;
    }

    // ⚠️ Check for empty fields
    if (!name || !email || !number || !password || !confirmPassword) {
      showToast("warn", "Please fill in all fields.");
      return;
    }

    // ⚠️ Check password match
    if (password !== confirmPassword) {
      showToast("error", "Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, number, password, name, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", data.error || "Signup failed. Please try again.");
        return;
      }

      showToast("success", "Account created successfully! Logging you in...");

      // Auto-login
      const loginRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (loginRes?.ok) {
        showToast("success", "Welcome to PakPay! Redirecting...");
        router.push("/api/post-login");
      } else {
        showToast("info", "Account created. Please log in.");
        router.push("/auth/signin");
      }
    } catch (error) {
      showToast("error", "Something went wrong. Please try again later.");
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
              placeholder="Enter Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />

            <Input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />

            <Input
              type="tel"
              placeholder="Enter phone number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />

            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />

            {/* ✅ NEW CONFIRM PASSWORD INPUT */}
            <Input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold mt-6"
            >
              Create Account
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