"use client"
import { Button, Card, Select, TextInput } from "@repo/ui"
import { useMemo, useState } from "react"
import { BankPaymentModal } from "./BankPaymentModal"
import { type BankKey, bankThemes } from "./bank-themes"

const BANK_KEYS: BankKey[] = ["HBL", "UBL", "MEEZAN"]

export const WithdrawMoney = () => {
  const [amount, setAmount] = useState(0)
  const [bankKey, setBankKey] = useState<BankKey>("HBL")
  const [open, setOpen] = useState(false)

  const options = useMemo(() => BANK_KEYS.map((k) => ({ key: k, value: bankThemes[k].displayName })), [])

  const persist = async () => {
    // Create a processing withdrawal record using existing API
    await fetch("/api/create-offramp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, bank: bankThemes[bankKey].displayName }),
    })
  }

  return (
    <Card title="Withdraw Money">
      <div className="w-full p-2">
        <TextInput label={"Amount"} placeholder={"Amount"} onChange={(value) => setAmount(Number(value))} />
        <div className="py-4 text-left">Bank</div>
        <Select
  onSelect={(key) => setBankKey(key as BankKey)}
  options={options}
/>

        <div className="flex justify-center pt-4">
          <Button
            onClick={() => {
              if (amount > 0) setOpen(true)
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
