"use client"
import { Button, Card, Select, TextInput } from "@repo/ui"
import { useMemo, useState } from "react"
import { BankPaymentModal } from "./BankPaymentModal"
import { type BankKey, bankThemes } from "./bank-themes"
import { showToast } from "../app/lib/toastMessage"

const BANK_KEYS: BankKey[] = ["HBL", "UBL", "MEEZAN"]

export const WithdrawMoney = () => {
  const [amount, setAmount] = useState(0)
  const [bankKey, setBankKey] = useState<BankKey>("HBL")
  const [accountHolderName, setAccountHolderName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [branch, setBranch] = useState("")
  const [open, setOpen] = useState(false)

  const options = useMemo(() => BANK_KEYS.map((k) => ({ key: k, value: bankThemes[k].displayName })), [])

  const persist = async () => {
    try {
      if (amount <= 0) {
        showToast("warning", "Please enter a valid withdrawal amount.")
        return
      }
      if (!accountHolderName.trim() || !accountNumber.trim()) {
        showToast("warning", "Account title and account / IBAN are required.")
        return
      }

      showToast("info", "Processing your withdrawal request...")

      const bankName = bankThemes[bankKey].displayName
      const res = await fetch("/api/create-offramp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          bank: bankName,
          accountHolderName: accountHolderName.trim(),
          bankName,
          accountNumber: accountNumber.trim(),
          branch: branch.trim() || undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg =
          typeof data?.error === "object"
            ? "Check your input and try again."
            : data?.error ?? "Failed to record transaction"
        showToast("error", String(msg))
        return
      }

      showToast(
        "success",
        `Transaction initialized successfully for PKR ${amount}.`,
      )

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
              amount,
              token: data.transaction.token,
              userId: data.transaction.userId,
            }),
          })
        } catch (webhookError) {
          console.error("Failed to trigger bank-webhook:", webhookError)
        }
      })()
    } catch {
      showToast("error", "Something went wrong while processing your withdrawal.")
    }
  }

  return (
    <Card title="Withdraw Money">
      <div className="w-full space-y-3 p-2">
        <TextInput
          label="Account title (as on bank)"
          placeholder="Full name"
          onChange={(value) => setAccountHolderName(value)}
        />
        <TextInput
          label="Account / IBAN"
          placeholder="PK00XXXX..."
          onChange={(value) => setAccountNumber(value)}
        />
        <TextInput
          label="Branch (optional)"
          placeholder="City / branch"
          onChange={(value) => setBranch(value)}
        />
        <TextInput label="Amount (PKR)" placeholder="Amount" onChange={(value) => setAmount(Number(value))} />
        <div className="py-2 text-left text-sm font-medium">Bank</div>
        <Select onSelect={(key) => setBankKey(key as BankKey)} options={options} />

        <div className="flex justify-center pt-4">
          <Button
            onClick={() => {
              if (amount > 0 && accountHolderName.trim() && accountNumber.trim()) {
                showToast("info", "Preparing withdrawal confirmation...")
                setOpen(true)
              } else {
                showToast("warning", "Fill account details and amount before proceeding.")
              }
            }}
          >
            Withdraw Money
          </Button>
        </div>
      </div>

      <BankPaymentModal
        isOpen={open}
        onClose={() => setOpen(false)}
        bankKey={bankKey}
        amount={amount}
        mode="withdraw"
        onPersist={persist}
      />
    </Card>
  )
}
