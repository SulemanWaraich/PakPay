// components/WithdrawMoney.tsx
"use client";
import { Button, Card, Center, Select, TextInput } from "@repo/ui";
import React, { useState } from "react";

const SUPPORTED_BANKS = [
  { name: "HBL (Habib Bank Limited)", redirectUrl: "https://www.hblibank.com.pk" },
  { name: "Meezan Bank", redirectUrl: "https://ebanking.meezanbank.com" },
  { name: "UBL (United Bank Limited)", redirectUrl: "https://www.ubldigital.com" },
  { name: "MCB Bank", redirectUrl: "https://www.mcb.com.pk" },
  { name: "Allied Bank Limited", redirectUrl: "https://www.abl.com" },
];

export const WithdrawMoney = () => {
  const [redirectUrl, setRedirectUrl] = useState(SUPPORTED_BANKS[0]?.redirectUrl);
  const [amount, setAmount] = useState(0);
  const [bank, setBank] = useState(SUPPORTED_BANKS[0]?.name);
  const [isProcessing, setIsProcessing] = useState(false);

  const onWithdraw = async () => {
    setIsProcessing(true);

    // Create a server side transaction record (processing)
    // Note: CreateOffRampTransaction is a server action. If it's exported as server action,
    // you can't call it directly from client. In your repo you called it after redirecting.
    // If you want to call a server action from client, you would need to use a form submit or an API route.
    // To keep parity with your current AddMoney pattern, we will:
    // 1) open bank redirect url
    // 2) attempt to call server action (best effort) - for safety you can instead call an api route.

    try {
      // open bank portal first (simulate redirect)
      window.location.href = redirectUrl || "";

      // Fire-and-forget server action - in app-router you cannot call server actions from client
      // directly unless using `use server` server action with form submit. If your CreateOffRampTransaction
      // is accessible as an API, call it. If not, adapt this to call a custom /api/create-offramp route.
      // Below is a best-effort fetch to an API route that you should create if needed:
      try {
        await fetch("/api/create-offramp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, bank }),
        });
      } catch (e) {
        // ignore - bank redirect already happened
        console.warn("failed to create offramp record via API", e);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card title="Withdraw Money">
      <div className="w-full p-2">
        <TextInput
          label={"Amount"}
          placeholder={"Amount"}
          onChange={(value) => setAmount(Number(value))}
        />
        <div className="py-4 text-left">Bank</div>
        <Select
          onSelect={(value) => {
            setRedirectUrl(SUPPORTED_BANKS.find((x) => x.name === value)?.redirectUrl || "");
            setBank(SUPPORTED_BANKS.find((x) => x.name === value)?.name || "");
          }}
          options={SUPPORTED_BANKS.map((x) => ({ key: x.name, value: x.name }))}
        />
        <div className="flex justify-center pt-4">
          <Button onClick={onWithdraw}>
            {isProcessing ? "Processing..." : "Withdraw"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
