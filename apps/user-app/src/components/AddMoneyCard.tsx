"use client"
import { Button } from "@repo/ui"
import { Card } from "@repo/ui"
import { Select } from "@repo/ui"
import { useMemo, useState } from "react"
import { TextInput } from "@repo/ui"
import { BankPaymentModal } from "./BankPaymentModal"
import { type BankKey, bankThemes } from "./bank-themes"
import { apiErrorMessage } from "../app/lib/apiErrors"

const BANK_KEYS: BankKey[] = ["HBL", "UBL", "MEEZAN"]

function parsePositiveAmount(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

export const AddMoney = () => {
  const [amount, setAmount] = useState("")
  const [bankKey, setBankKey] = useState<BankKey>("HBL")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ amount?: string; bank?: string; form?: string }>({})

  const options = useMemo(() => BANK_KEYS.map((k) => ({ key: k, value: bankThemes[k].displayName })), [])

  const clearError = (field: "amount" | "bank") => {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      delete next.form
      return next
    })
  }

  const validate = (): boolean => {
    const next: typeof errors = {}

    const parsed = parsePositiveAmount(amount)
    if (parsed === null) {
      next.amount = "Please enter a valid amount"
    } else if (parsed < 1) {
      next.amount = "Minimum deposit is Rs. 1"
    } else if (parsed > 50000) {
      next.amount = "Maximum deposit is Rs. 50,000"
    }

    if (!bankThemes[bankKey]?.displayName) {
      next.bank = "Please select a bank"
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const persist = async () => {
    const parsedAmount = parsePositiveAmount(amount)
    if (parsedAmount === null) return

    setLoading(true)
    try {
      const res = await fetch("/api/create-onramp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount, bank: bankThemes[bankKey].displayName }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrors({ form: apiErrorMessage(data, "Something went wrong. Please try again.") })
        return
      }

      void (async () => {
        const delay = (min: number, max: number) =>
          new Promise((resolve) =>
            setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min),
          )

        await delay(2000, 5000)

        try {
          await fetch("/api/onramp-proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: parsedAmount,
              token: data.transaction.token,
              userId: data.transaction.userId,
            }),
          })
        } catch (webhookError) {
          console.error("Failed to trigger bank-webhook:", webhookError)
        }
      })()
    } catch {
      setErrors({ form: "Something went wrong. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = () => {
    if (!validate()) return
    setErrors({})
    setOpen(true)
  }

  return (
    <Card title="Add Money">
      <div className="w-full p-2">
        {errors.form && (
          <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{errors.form}</p>
        )}

        <div>
          <TextInput
            label={"Amount"}
            placeholder={"Amount"}
            type="number"
            value={amount}
            onChange={(value) => {
              setAmount(value)
              clearError("amount")
            }}
          />
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
        </div>

        <div className="py-4 text-left">Bank</div>
        <Select
          onSelect={(key) => {
            setBankKey(key as BankKey)
            clearError("bank")
          }}
          options={options}
        />
        {errors.bank && <p className="text-red-500 text-sm mt-1">{errors.bank}</p>}

        <div className="flex justify-center pt-4">
          <Button onClick={handleOpenModal} disabled={loading}>
            {loading ? "Processing..." : "Deposit Money"}
          </Button>
        </div>
      </div>

      <BankPaymentModal
        isOpen={open}
        onClose={() => setOpen(false)}
        bankKey={bankKey}
        amount={parsePositiveAmount(amount) ?? 0}
        mode="deposit"
        onPersist={persist}
      />
    </Card>
  )
}
