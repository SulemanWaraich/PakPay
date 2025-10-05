"use client";
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import Link from "next/link"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { showToast } from "../../lib/toastMessage";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // ⚠️ Check for empty fields
    if (!name || !email || !number || !password) {
      showToast("warn", "Please fill in all fields.");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, number, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", data.error || "Signup failed. Please try again.");
        return;
      }

      showToast("success", "Account created successfully! Logging you in...");

      // ✅ Auto-login after successful signup    
      const loginRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (loginRes?.ok) {
        showToast("success", "Welcome to PakPay! Redirecting to dashboard...");
        router.push("/dashboard");
      } else {
        showToast("info", "Account created. Please log in to continue.");
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
          {/* Logo */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-green-600 mb-6">PakPay</h1>
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">Sign up</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="name"
                placeholder="Enter Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                required
              />
            </div>

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
                type="tel"
                placeholder="Enter phone number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
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

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-full text-base font-semibold mt-6"
            >
              Next
            </Button>
          </form>

          {/* Sign in link */}
          <div className="text-center">
            <Link href="/auth/signin">
              <Button
                variant="outline"
                className="w-full border-green-600 text-green-600 hover:bg-green-50 py-3 rounded-full text-base font-semibold bg-transparent"
              >
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
