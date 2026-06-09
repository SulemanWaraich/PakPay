"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function Hero() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleGetStarted = () => {
    if (!session) {
      router.push("/api/selector");
      return;
    }
    if (session.user.role === "USER") {
      router.push("/user/dashboard");
    } else if (session.user.role === "MERCHANT") {
      router.push("/merchant/dashboard");
    }
  };

  const handleHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Subtle dot grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #16a34a22 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#16a34a]/5 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-16">
        {/* Left: copy */}
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
            Trusted by 1000+ Pakistanis
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            The Smarter Way to
            <br />
            <span className="text-[#16a34a]">Pay in Pakistan</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Send money, pay merchants, and manage your finances — all in one
            secure digital wallet.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleGetStarted}
              className="rounded-xl bg-[#16a34a] px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#16a34a]/20 transition-all hover:-translate-y-0.5 hover:bg-[#15803d] hover:shadow-xl hover:shadow-[#16a34a]/30"
            >
              {session ? "Go to Dashboard" : "Create Free Account"}
            </button>
            <button
              onClick={handleHowItWorks}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-900 transition-all hover:border-slate-400 hover:bg-slate-50"
            >
              See How It Works
            </button>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#16a34a]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No hidden fees
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#16a34a]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              SBP regulated
            </div>
          </div>
        </div>

        {/* Right: phone mockup with floating cards */}
        <div className="relative mx-auto flex h-[560px] w-full max-w-md items-center justify-center">
          {/* Phone frame */}
          <div className="relative h-[520px] w-[260px] rounded-[3rem] border border-slate-200 bg-slate-900 p-3 shadow-2xl shadow-slate-900/20">
            <div className="relative h-full w-full overflow-hidden rounded-[2.4rem] bg-gradient-to-b from-[#16a34a] to-[#15803d] p-5">
              {/* Notch */}
              <div className="absolute left-1/2 top-3 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
              <div className="mt-8 text-white/80 text-xs font-medium">Good morning,</div>
              <div className="text-white text-lg font-semibold">Ayesha Khan</div>
              <div className="mt-6 rounded-2xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
                <div className="text-white/70 text-xs">Available Balance</div>
                <div className="text-white text-2xl font-bold mt-1">₨ 24,500</div>
                <div className="text-white/60 text-[10px] mt-1">**** 4829</div>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                {["Send", "Pay", "Top-up", "Bills"].map((label) => (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20" />
                    <div className="text-white/80 text-[9px]">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-white p-3">
                <div className="text-slate-900 text-xs font-semibold">Recent</div>
                {[
                  { name: "Ahmed S.", amt: "-₨ 1,200" },
                  { name: "K-Electric", amt: "-₨ 3,400" },
                  { name: "Salary", amt: "+₨ 85,000" },
                ].map((t) => (
                  <div key={t.name} className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-100" />
                      <div className="text-slate-700 text-[11px]">{t.name}</div>
                    </div>
                    <div className={`text-[11px] font-semibold ${t.amt.startsWith("+") ? "text-[#16a34a]" : "text-slate-900"}`}>
                      {t.amt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating cards */}
          <div className="absolute -left-4 top-16 hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10 sm:block" style={{ animation: "float 6s ease-in-out infinite" }}>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16a34a]/10">
                <svg className="h-4 w-4 text-[#16a34a]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Status</div>
                <div className="text-xs font-semibold text-slate-900">Transaction Successful</div>
              </div>
            </div>
          </div>

          <div className="absolute -right-2 top-44 hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10 sm:block" style={{ animation: "float 6s ease-in-out infinite 1s" }}>
            <div className="text-[10px] text-slate-500">Balance</div>
            <div className="text-lg font-bold text-slate-900">₨ 24,500</div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-[#16a34a]">
              <span>↑ 12.4%</span>
              <span className="text-slate-400">this month</span>
            </div>
          </div>

          <div className="absolute -right-4 bottom-20 hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10 sm:block" style={{ animation: "float 6s ease-in-out infinite 2s" }}>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16a34a]/10">
                <svg className="h-4 w-4 text-[#16a34a]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Verified</div>
                <div className="text-xs font-semibold text-slate-900">Merchant Verified</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </section>
  );
}

export default Hero;
