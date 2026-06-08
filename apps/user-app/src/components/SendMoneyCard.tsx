"use client"
import { Button, Card, TextInput } from "@repo/ui"
import { useState } from "react"
import { p2pTransfer } from "../app/lib/actions/p2pTransfer"
const DEMO_ACCOUNTS = [
  { number: "+923007654321", name: "Ahmed Khan", role: "Merchant" },
  { number: "+923451234567", name: "Usman Tariq", role: "User2" },
] as const

export const SendMoneyCard = () => {
  const [amount, setAmount] = useState("")
  const [number, setNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ number?: string; amount?: string; form?: string }>({})

  const clearFieldError = (field: "number" | "amount") => {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      delete next.form
      return next
    })
  }

  const validate = async (): Promise<boolean> => {
    const next: typeof errors = {}

    if (!number.trim()) {
      next.number = "Please enter recipient's account number"
    }
    if (!amount.trim()) {
      next.amount = "Please enter an amount"
    } else {
      const parsed = Number(amount)
      if (parsed < 1) {
        next.amount = "Minimum transfer is Rs. 1"
      }
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSendMoney = async () => {
    if (!(await validate())) return

    setLoading(true)
    setErrors({})

    const response = await p2pTransfer(number.trim(), Number(amount))
    setLoading(false)

    if (response.success) {
      setAmount("")
      setNumber("")
    } else {
      const message = response.message
      if (message.toLowerCase().includes("not found")) {
        setErrors({ number: "No account found with this number" })
      } else if (message.toLowerCase().includes("insufficient")) {
        setErrors({ amount: "Insufficient balance" })
      } else if (message.toLowerCase().includes("yourself")) {
        setErrors({ number: "You cannot send money to yourself" })
      } else {
        setErrors({ form: message })
      }
    }
  }

  return (
    <Card title="Send Money">
      <div className="w-full p-2">
        {errors.form && (
          <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{errors.form}</p>
        )}

        <div>
          <TextInput
            label="Account Number"
            placeholder="Enter receiver's account number"
            value={number}
            onChange={(value) => {
              setNumber(value)
              clearFieldError("number")
            }}
          />
          {errors.number && <p className="mt-1 text-xs text-red-600">{errors.number}</p>}

          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-2">Demo accounts you can send to:</p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.number}
                  type="button"
                  onClick={() => {
                    setNumber(account.number)
                    clearFieldError("number")
                  }}
                  className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full cursor-pointer hover:bg-green-50 hover:text-green-700"
                >
                  {account.number} · {account.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Enter the recipient&apos;s registered phone number
            </p>
          </div>
        </div>

        <div>
          <TextInput
            label="Amount"
            placeholder="Enter amount"
            value={amount}
            onChange={(value) => {
              setAmount(value)
              clearFieldError("amount")
            }}
          />
          {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
        </div>

        <div className="flex justify-center pt-4">
          <Button onClick={() => { if (!loading) void handleSendMoney() }}>
            {loading ? "Sending..." : "Send Money"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
