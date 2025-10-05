"use client"
import { Button } from "@repo/ui"
import { Card } from "@repo/ui"
import { Select } from "@repo/ui"
import { useMemo, useState } from "react"
import { TextInput } from "@repo/ui"
import { CreateOnRampTransaction } from "../app/lib/actions/CreateOnRamptxn"
import { BankPaymentModal } from "./BankPaymentModal"
import { type BankKey, bankThemes } from "./bank-themes"
import { useRouter } from "next/navigation"

// Limit to requested banks
const BANK_KEYS: BankKey[] = ["HBL", "UBL", "MEEZAN"]

export const AddMoney = () => {
  const [amount, setAmount] = useState(0)
  const [bankKey, setBankKey] = useState<BankKey>("HBL")
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const options = useMemo(() => BANK_KEYS.map((k) => ({ key: k, value: bankThemes[k].displayName })), [])

  // const persist = async () => {
  //   // Keep existing server action usage to record a "Processing" onramp txn
  //   await CreateOnRampTransaction(amount, bankThemes[bankKey].displayName)
  // }

  const persist = async () => {
    // Create a processing withdrawal record using existing API
    await fetch("/api/create-onramp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, bank: bankThemes[bankKey].displayName }),
    })
  }

  return (
    <Card title="Add Money">
      <div className="w-full p-2">
        <TextInput
          label={"Amount"}
          placeholder={"Amount"}
          onChange={(value) => {
            setAmount(Number(value))
          }}
        />
        <div className="py-4 text-left">Bank</div>
    <Select
  onSelect={(key) => setBankKey(key as BankKey)}
  options={options}
/>

        <div className="flex justify-center pt-4">
          <Button
            onClick={() => {
              if (amount > 0) {
                setOpen(true)
              }
            }}
          >
            Deposit Money
          </Button>
        </div>
      </div>

      <BankPaymentModal
        isOpen={open}
        onClose={() => setOpen(false)}
        bankKey={bankKey}
        amount={amount}
        mode="deposit"
        onPersist={persist}
      />
    </Card>
  )
}
