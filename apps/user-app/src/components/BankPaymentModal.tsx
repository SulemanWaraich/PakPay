"use client"

import { useEffect, useMemo, useState } from "react"
import { bankThemes, type BankKey } from "./bank-themes"
import { useRouter } from "next/navigation"
import { Button } from "@repo/ui"
import { showToast } from "../app/lib/toastMessage";

type Mode = "deposit" | "withdraw"

type Props = {
  isOpen: boolean
  onClose: () => void // will auto-call on success
  bankKey: BankKey
  amount: number
  mode: Mode
  // Optional callbacks to persist transactions (server-side)
  onPersist?: () => Promise<void>
}

export function BankPaymentModal({ isOpen, onClose, bankKey, amount, mode, onPersist }: Props) {
  const theme = useMemo(() => bankThemes[bankKey], [bankKey])
  const [accountNumber, setAccountNumber] = useState("")
  const [cvv, setCvv] = useState("")
  const [expiry, setExpiry] = useState("")
  const [errors, setErrors] = useState<{ account?: string; cvv?: string; expiry?: string }>({})
  const [loading, setLoading] = useState(false)
  const [succeeded, setSucceeded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!isOpen) {
      // reset when closed
      setAccountNumber("")
      setCvv("")
      setExpiry("")
      setErrors({})
      setLoading(false)
      setSucceeded(false)
    }
  }, [isOpen])

  const validate = () => {
    const next: typeof errors = {}
    if (!accountNumber) next.account = "Account number is required"
    if (accountNumber && !/^\d{10,18}$/.test(accountNumber)) next.account = "Enter 10-18 digits"
    if (!cvv) next.cvv = "CVV is required"
    if (cvv && !/^\d{3,4}$/.test(cvv)) next.cvv = "CVV must be 3-4 digits"
    if (!expiry) next.expiry = "Expiry is required"
    if (expiry && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) next.expiry = "Use MM/YY format"
    setErrors(next)
    // return Object.keys(next).length === 0

     if (Object.keys(next).length > 0) {
      showToast("warning", "Please fix the form errors before proceeding.");
      return false;
    }

    return true;
  }

  

  const proceed = async () => {
    if (!validate()) return
    setLoading(true);
    showToast("info", "Processing your transaction...");

    // Simulate 1.2s payment processing
    setTimeout(async () => {
        try {
        if (onPersist) await onPersist();

        setSucceeded(true);
        showToast(
          "success",
          `Transaction successful! PKR ${amount} ${
            mode === "deposit" ? "deposited" : "withdrawn"
          } successfully.`
        );

        setTimeout(() => {
          onClose();
          router.refresh();
        }, 900);
      } catch (error) {
        showToast("error", "Transaction failed. Please try again later.");
      } finally {
        setLoading(false);
      }
    }, 1200);
  };

  if (!isOpen) return null

  // prevent closing before confirmation per requirement
  const canDismiss = succeeded && !loading

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60"
       onClick={() => {
          if (!canDismiss)
            showToast("info", "Please wait until the transaction is complete.");
          if (canDismiss) onClose();
        }}
      />
      {/* Panel (approx 50% screen on desktop, full width on mobile) */}
      <div
        className="relative w-[92%] max-w-2xl md:w-1/2 rounded-lg overflow-hidden shadow-xl"
        style={{ backgroundColor: theme.surface, color: theme.surfaceText }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: theme.primary, color: theme.primaryText }}
        >
          <h2 className="text-lg font-semibold text-pretty">
            {mode === "deposit" ? "Paying via " : "Withdrawing via "}
            {theme.displayName}
          </h2>
          <button
            aria-label="Close"
             onClick={() => {
              if (!canDismiss)
                showToast("info", "Please wait until the transaction completes.");
              if (canDismiss) onClose();
            }}
            className={`rounded px-2 py-1 text-sm ${canDismiss ? "opacity-100" : "opacity-50 cursor-not-allowed"}`}
            style={{
              backgroundColor: theme.accent || "rgba(255,255,255,0.15)",
              color: theme.primaryText,
            }}
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-sm mb-3">
            Amount: <span className="font-semibold">PKR {amount || 0}</span>
          </p>

          {!succeeded ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                proceed()
              }}
              className="grid grid-cols-1 gap-3"
            >
              <div>
                <label className="block text-sm mb-1">Account Number</label>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
                  placeholder="16-digit account number"
                  value={accountNumber}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "")
                    setAccountNumber(v)
                  }}
                />
                {errors.account ? <p className="text-red-600 text-xs mt-1">{errors.account}</p> : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">CVV</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
                    placeholder="3-4 digits"
                    value={cvv}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "")
                      setCvv(v.slice(0, 4))
                    }}
                  />
                  {errors.cvv ? <p className="text-red-600 text-xs mt-1">{errors.cvv}</p> : null}
                </div>
                <div>
                  <label className="block text-sm mb-1">Expiry (MM/YY)</label>
                  <input
                    className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                  />
                  {errors.expiry ? <p className="text-red-600 text-xs mt-1">{errors.expiry}</p> : null}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded border"
                  onClick={() => onClose()}
                >
                  Cancel
                </button>
                <Button onClick={proceed}>{loading ? "Processing..." : "Proceed"}</Button>
              </div>

                 {/* 🧾 Informational Note */}
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                <strong>Note:</strong> This is not how payments work in real-time. 
  In a live production system, users would be redirected to their bank’s secure 
  payment gateway to complete the transaction. Since this project isn't production-ready yet and doesn't use real banking APIs, 
                this modal flow has been added to simulate a real user experience.
              </p>
            </form>
          ) : (
            <div className="text-center py-10">
              <div
                className="mx-auto mb-3 h-10 w-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.accent || theme.primary, color: theme.primaryText }}
              >
                ✓
              </div>
              <p className="font-semibold">
                Transaction successful! PKR {amount || 0} {mode === "deposit" ? "deposited." : "withdrawn."}
              </p>
              <p className="text-xs text-gray-600 mt-1">Closing shortly...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
