const bullets = [
  "Lowest Transaction Fees in Pakistan",
  "24/7 Customer Support",
  "Nationwide Merchant Network",
  "Instant Settlement",
];

const stats = [
  { value: "1K+", label: "Active Users" },
  { value: "₨1M+", label: "Processed Monthly" },
  { value: "99.9%", label: "Uptime" },
];

export function WhyPakPay() {
  return (
    <section id="why-pakpay" className="bg-white py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16a34a]">
            Why PakPay
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Why Thousands Choose PakPay
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">
            We built PakPay from the ground up for the way Pakistan moves money —
            fast, fair, and always available.
          </p>

          <ul className="mt-8 space-y-4">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#16a34a]/10">
                  <svg className="h-3.5 w-3.5 text-[#16a34a]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-base font-medium text-slate-800">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-4 rounded-3xl bg-[#16a34a]/10 blur-2xl"
          />
          <div className="relative rounded-3xl bg-slate-900 p-8 shadow-2xl shadow-slate-900/30 sm:p-10">
            <div className="flex items-center gap-2 text-xs font-medium text-[#4ade80]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4ade80]" />
              Live network
            </div>
            <div className="mt-8 space-y-8">
              {stats.map((s, i) => (
                <div key={s.label}>
                  <div className="text-4xl font-bold text-white sm:text-5xl">
                    {s.value}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">{s.label}</div>
                  {i < stats.length - 1 && (
                    <div className="mt-8 h-px w-full bg-white/10" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="text-xs text-slate-400">Trusted by leading partners</div>
              <div className="mt-3 flex items-center gap-4 text-sm font-semibold text-slate-300">
                <span>1LINK</span>
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span>RAAST</span>
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span>SBP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default WhyPakPay;