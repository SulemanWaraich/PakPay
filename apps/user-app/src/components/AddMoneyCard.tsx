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
import { showToast } from "../app/lib/toastMessage";

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
  try {
    const res = await fetch("/api/create-onramp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, bank: bankThemes[bankKey].displayName }),
    });

    if (!res.ok) throw new Error("Failed to record transaction");

    const data = await res.json();
    showToast(
      "success",
      `Transaction initialized successfully for PKR ${amount}.`
    );

    console.log(res, data);

    // Trigger dummy-bank webhook asynchronously after a short delay
    (async () => {
      const delay = (min: number, max: number) =>
        new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

      await delay(2000, 5000); // random delay 2-5s

      try {
        await fetch("/api/onramp-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            token: data.transaction.token,
            userId: data.transaction.userId,
          }),
        });
        console.log("✅ Dummy bank-webhook triggered for Add Money");
      } catch (webhookError) {
        console.error("❌ Failed to trigger dummy bank-webhook:", webhookError);
      }
    })();

  } catch (error) {
    showToast("error", "Failed to record transaction. Please try again.");
  }
};
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
              if (amount <= 0) {
                showToast("warning", "Please enter a valid amount to deposit.");
                return;
              }
              showToast(
                "info",
                `Opening ${bankThemes[bankKey].displayName} payment modal...`
              );
              setOpen(true);
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
