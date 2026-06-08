"use client";
// import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Code2, Lightbulb, Settings, Check, ArrowRight } from "lucide-react";


    export const meta = [
      { title: "Careers at PakPay" },
      { name: "description", content: "Join PakPay — building the future of payments in Pakistan. Internship & graduate roles opening soon." },
      { property: "og:title", content: "Careers at PakPay" },
      { property: "og:description", content: "Join PakPay — building the future of payments in Pakistan." },
    ]

export default function CareersPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (email.trim()) {
//       setSubmitted(true);
//       setEmail("");
//     }
//   };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
  
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
  
      if (res.ok) {
        setSubmitted(true);
        setEmail("");
      } else {
        console.error("Failed to send");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center px-6 pt-12 pb-20 md:px-12 md:pt-20">
        <div className="w-full max-w-3xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-600 opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-600"></span>
            </span>
            Careers
          </div>

          {/* Headline */}
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl leading-tight">
            We&apos;re Building the{" "}
            <span className="text-green-600">Future of Payments</span>{" "}
            in Pakistan
          </h1>

          {/* Subtext */}
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg leading-relaxed">
            Internship &amp; graduate roles opening soon — we&apos;re looking for
            <span className="font-semibold text-foreground"> builders</span>, not
            just coders.
          </p>

          {/* Email Form */}
          <div className="mt-10">
            {submitted ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand-muted px-5 py-3 text-sm font-medium text-brand">
                <Check className="h-4 w-4" />
                You&apos;re on the list. We&apos;ll reach out when roles open.
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mx-auto flex w-full max-w-md flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-12 flex-1 rounded-xl border border-input bg-background px-4 text-sm text-foreground shadow-sm outline-none ring-ring transition-all focus:ring-2 focus:ring-offset-2 focus:ring-offset-background placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-600/90 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-background"
                >
                  Notify Me
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Role Cards */}
        <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          <RoleCard
            icon={<Code2 className="h-6 w-6" />}
            title="Engineering"
            description="Backend, frontend, mobile, and infrastructure teams."
          />
          <RoleCard
            icon={<Lightbulb className="h-6 w-6" />}
            title="Product"
            description="Product management, design, and user research."
          />
          <RoleCard
            icon={<Settings className="h-6 w-6" />}
            title="Operations"
            description="Customer success, compliance, and business ops."
          />
        </div>
      </main>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-border bg-muted/40 p-6 text-left opacity-70 transition-opacity hover:opacity-90">
      <span className="absolute top-4 right-4 inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Coming Soon
      </span>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-green-700 text-white">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
