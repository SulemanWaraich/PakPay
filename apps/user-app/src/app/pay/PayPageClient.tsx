"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { BankPaymentModal } from "../../components/BankPaymentModal";  // same modal as AddMoney
import {  type BankKey, bankThemes } from "../../components/bank-themes";
import { apiErrorMessage } from "../lib/apiErrors";
import { showToast } from "../lib/toastMessage";

type Merchant = {
  id: string;
  businessName: string;
  ownerName: string;
  category: string;
  address: string;
  // other fields...
};

export default function PayPage() {
  const params = useSearchParams();

  const merchantId = params.get("mid");
  const type = params.get("type");
  const ref = params.get("ref");

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("WALLET"); // wallet | bank
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openBankModal, setOpenBankModal] = useState(false);
  const [bankKey, setBankKey] = useState<BankKey>("HBL");


  const [txnRef] = useState(() => nanoid(12));

  if (!type || !merchantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-center px-4">
          Invalid payment link. Ask the merchant for a valid QR code.
        </p>
      </div>
    );
  }

  // fetch merchant
  useEffect(() => {
    const fetchMerchant = async () => {
      try {
        const res = await fetch(`/api/pay/merchant?mid=${merchantId}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(
            apiErrorMessage(data, "This merchant is not available for payments."),
          );
          return;
        }
        setMerchant(data);
      } catch {
        setError("Could not load merchant details. Try scanning the QR again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMerchant();
  }, [merchantId]);

  // wallet → wallet payment
  const handleWalletPay = async () => {
    const res = await fetch("/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantId,
        amount: Number(amount),
        ref: txnRef,
        paymentMethod,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(apiErrorMessage(data, "Payment failed. Please try again."));
      return;
    }

    setSuccess(true);
  };

  const handlePay = () => {
    if (!amount || Number(amount) <= 0) {
      showToast("warning", "Enter an amount greater than zero (PKR).");
      return;
    }

    if (paymentMethod === "WALLET") {
      handleWalletPay();
    } else {
      setOpenBankModal(true);
    }
  };

  // automatically called by modal when bank deposit finishes
  const handleBankDepositComplete = async () => {
    await handleWalletPay(); // wallet now has money → pay merchant
  };

  if (loading)
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  if (error)
    return <div className="min-h-screen flex items-center justify-center">{error}</div>;

  if (success)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-green-600">Payment Successful</h2>
          <p>
            You paid Rs {amount} to <strong>{merchant?.businessName}</strong>
          </p>
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow">
      <div className="text-center mb-4">
        <h1 className="text-xl font-semibold">Pay {merchant?.businessName}</h1>
      </div>

      <input
        type="number"
        className="w-full px-3 py-2 border rounded-lg mb-4"
        placeholder="Enter Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {/* Payment Method */}
      <label>Payment Method</label>
      <select
        className="w-full border px-3 py-2 rounded-lg mb-4"
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
      >
        <option value="WALLET">Wallet Balance</option>
        <option value="BANK_TRANSFER">Bank Transfer</option>
      </select>

      {paymentMethod === "BANK_TRANSFER" && (
        <select
          className="w-full border px-3 py-2 rounded-lg mb-3"
          value={bankKey}
          onChange={(e) => setBankKey(e.target.value as BankKey)}
        >
          {Object.keys(bankThemes).map((k) => (
            <option key={k} value={k}>
              {bankThemes[k as BankKey].displayName}
            </option>
          ))}
        </select>
      )}

      <button
        onClick={handlePay}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-xl"
      >
        Pay Now
      </button>

      {/* BANK MODAL */}
      <BankPaymentModal
        isOpen={openBankModal}
        onClose={() => setOpenBankModal(false)}
        bankKey={bankKey}
        amount={Number(amount)}
        mode="merchant-payment"
        onPersist={() => handleBankDepositComplete()}
      />
    </div>
  );
}
