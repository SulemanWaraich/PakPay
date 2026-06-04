"use client";

type DemoCredentialsBannerProps = {
  onSelect: (email: string, password: string) => void;
};

const DEMO_ROWS = [
  { role: "User", email: "demo.user@pakpay.site", password: "Demo@1234" },
  { role: "Merchant", email: "demo.merchant@pakpay.site", password: "Demo@1234" },
] as const;

export function DemoCredentialsBanner({ onSelect }: DemoCredentialsBannerProps) {
  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-left text-sm text-slate-700">
      <p className="font-semibold text-sky-900 mb-2">🎮 Try the demo</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-sky-200">
              <th className="pb-1 pr-3 font-medium">Role</th>
              <th className="pb-1 pr-3 font-medium">Email</th>
              <th className="pb-1 font-medium">Password</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_ROWS.map((row) => (
              <tr
                key={row.email}
                className="border-b border-sky-100 last:border-0 cursor-pointer transition-colors hover:bg-sky-100/80"
                onClick={() => onSelect(row.email, row.password)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(row.email, row.password);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Fill login as ${row.role}`}
              >
                <td className="py-2 pr-3 font-medium text-slate-800">{row.role}</td>
                <td className="py-2 pr-3 text-sky-800">{row.email}</td>
                <td className="py-2 font-mono text-slate-600">{row.password}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Click a row to fill the form. Demo accounts reset daily. Simulated funds only.
      </p>
    </div>
  );
}
