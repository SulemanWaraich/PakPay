"use client"
// components/StatementExportButton.tsx
// Drop this anywhere in your merchant dashboard.
// It renders a styled "Export Statement" button with a month picker dropdown.
//
// Usage:
//   <StatementExportButton />

import { useState } from "react"
import { Download, ChevronDown, Loader2 } from "lucide-react"

type Period = { label: string; value: string }

function buildPeriods(): Period[] {
  const periods: Period[] = [{ label: "All Time", value: "" }]
  const now = new Date()

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleString("default", { month: "long", year: "numeric" })
    periods.push({ label, value })
  }
  return periods
}

export default function StatementExportButton() {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Period>(buildPeriods()[1]) // default = current month

  const periods = buildPeriods()

  async function handleExport() {
    setLoading(true)
    try {
      const params = selected.value ? `?month=${selected.value}` : ""
      const res = await fetch(`/api/merchant/statement${params}`)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error ?? "Failed to generate statement. Please try again.")
        return
      }

      // Trigger browser download
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = `pakpay-statement-${selected.value || "all-time"}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Period selector */}
      <div className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="
            flex items-center gap-1.5 px-3 py-2 text-sm font-medium
            border border-gray-200 rounded-lg bg-white text-gray-700
            hover:bg-gray-50 transition-colors shadow-sm
          "
        >
          {selected.label}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div
            className="
              absolute right-0 top-full mt-1 z-50
              w-48 bg-white border border-gray-200 rounded-lg shadow-lg
              py-1 max-h-64 overflow-y-auto
            "
          >
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => { setSelected(p); setOpen(false) }}
                className={`
                  w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700
                  transition-colors
                  ${selected.value === p.value ? "bg-emerald-50 text-emerald-700 font-medium" : "text-gray-700"}
                `}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={loading}
        className="
          flex items-center gap-2 px-4 py-2 text-sm font-semibold
          bg-gradient-to-r from-emerald-600 to-green-600 text-white
          rounded-lg shadow-sm hover:from-emerald-700 hover:to-green-700
          disabled:opacity-60 disabled:cursor-not-allowed
          transition-all active:scale-95
        "
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Download className="w-4 h-4" />
        }
        {loading ? "Generating…" : "Export Statement"}
      </button>
    </div>
  )
}
