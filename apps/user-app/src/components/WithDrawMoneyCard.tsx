"use client"
import { Button, Card, Select, TextInput } from "@repo/ui"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BankPaymentModal } from "./BankPaymentModal"
import { type BankKey, bankThemes } from "./bank-themes"
import { apiErrorMessage } from "../app/lib/apiErrors"
import BranchSelect from "./BranchSelect"

const BANK_KEYS: BankKey[] = ["HBL", "UBL", "MEEZAN"]

const DEMO_WITHDRAW = {
  accountHolderName: "Sara Malik",
  bankName: "HBL" as BankKey,
  accountNumber: "01234567890123",
  branch: "Karachi Main Branch",
}

function parsePositiveAmount(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

export const WithdrawMoney = () => {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [bankKey, setBankKey] = useState<BankKey>("HBL")
  const [accountHolderName, setAccountHolderName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [branch, setBranch] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errors, setErrors] = useState<{
    amount?: string
    accountHolderName?: string
    accountNumber?: string
    bankName?: string
    form?: string
  }>({})

  const options = useMemo(() => BANK_KEYS.map((k) => ({ key: k, value: bankThemes[k].displayName })), [])

  const resetForm = () => {
    setAmount("")
    setBankKey("HBL")
    setAccountHolderName("")
    setAccountNumber("")
    setBranch("")
    setErrors({})
  }

  useEffect(() => {
    setBranch("")
  }, [bankKey])

  const clearError = (field: keyof typeof errors) => {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      delete next.form
      return next
    })
  }

  const applyDemoPrefill = () => {
    setAccountHolderName(DEMO_WITHDRAW.accountHolderName)
    setBankKey(DEMO_WITHDRAW.bankName)
    setAccountNumber(DEMO_WITHDRAW.accountNumber)
    setBranch(DEMO_WITHDRAW.branch)
    setSuccessMessage("")
    setErrors({})
  }

  const validate = (): boolean => {
    const next: typeof errors = {}

    if (!accountHolderName.trim()) {
      next.accountHolderName = "Please enter account holder name"
    }

    if (!accountNumber.trim()) {
      next.accountNumber = "Please enter account number"
    } else if (accountNumber.trim().length < 10 || accountNumber.trim().length > 34) {
      next.accountNumber = "Account number must be 10 to 34 characters"
    }

    const parsed = parsePositiveAmount(amount)
    if (parsed === null) {
      next.amount = "Please enter a valid amount"
    } else if (parsed < 1) {
      next.amount = "Minimum withdrawal is Rs. 1"
    }

    if (!bankThemes[bankKey]?.displayName) {
      next.bankName = "Please select a bank"
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const persist = async () => {
    const parsedAmount = parsePositiveAmount(amount)
    if (parsedAmount === null) return

    const bankName = bankThemes[bankKey].displayName

    setLoading(true)
    try {
      const res = await fetch("/api/create-offramp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          bank: bankName,
          accountHolderName: accountHolderName.trim(),
          bankName,
          accountNumber: accountNumber.trim(),
          branch: branch.trim() || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = apiErrorMessage(data, "Something went wrong. Please try again.")
        if (msg.toLowerCase().includes("insufficient")) {
          setErrors({ amount: "Insufficient balance" })
        } else {
          setErrors({ form: msg })
        }
        return
      }

      void (async () => {
        const delay = (min: number, max: number) =>
          new Promise((resolve) =>
            setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min),
          )

        await delay(2000, 5000)

        try {
          await fetch("/api/offramp-proxy", {
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
    <Card title="Withdraw Money">
      <div className="w-full space-y-3 p-2">
        {successMessage && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</p>
        )}
        {errors.form && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{errors.form}</p>
        )}

        <div>
          <p className="text-xs text-gray-500 mb-2">Demo quick-fill:</p>
          <button
            type="button"
            onClick={applyDemoPrefill}
            className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full cursor-pointer hover:bg-green-50 hover:text-green-700"
          >
            Sara Malik · HBL · Karachi Main Branch
          </button>
        </div>

        <div>
          <TextInput
            label="Account title (as on bank)"
            placeholder="Full name"
            value={accountHolderName}
            onChange={(value) => {
              setAccountHolderName(value)
              clearError("accountHolderName")
            }}
          />
          {errors.accountHolderName && (
            <p className="text-red-500 text-sm mt-1">{errors.accountHolderName}</p>
          )}
        </div>

        <div>
          <TextInput
            label="Account / IBAN"
            placeholder="Enter your bank account number"
            value={accountNumber}
            onChange={(value) => {
              setAccountNumber(value)
              clearError("accountNumber")
            }}
          />
          <p className="text-xs text-gray-400 mt-1">Accepted: 10 to 34 digit account numbers</p>
          {errors.accountNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>
          )}
        </div>

        <BranchSelect
          key={bankKey}
          bankKey={bankKey}
          value={branch}
          onChange={setBranch}
        />

        <div>
          <TextInput
            label="Amount (PKR)"
            placeholder="Amount"
            type="number"
            value={amount}
            onChange={(value) => {
              setAmount(value)
              clearError("amount")
            }}
          />
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
        </div>

        <div className="py-2 text-left text-sm font-medium">Bank</div>
        <Select
          onSelect={(key) => {
            setBankKey(key as BankKey)
            clearError("bankName")
          }}
          options={options}
        />
        {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}

        <div className="flex justify-center pt-4">
          <Button onClick={handleOpenModal} disabled={loading}>
            {loading ? "Processing..." : "Withdraw Money"}
          </Button>
        </div>
      </div>

      <BankPaymentModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          resetForm()
          setSuccessMessage("Withdrawal submitted successfully.")
          router.refresh()
        }}
        bankKey={bankKey}
        amount={parsePositiveAmount(amount) ?? 0}
        mode="withdraw"
        onPersist={persist}
      />
    </Card>
  )
}
