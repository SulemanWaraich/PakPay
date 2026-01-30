"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Merchant = {
  id: number;
  businessName: string;
  logoUrl?: string | null;
};

export default function PayPage() {
  const params = useSearchParams();

  const type = params.get("type");       // merchant | invoice
  const merchantId = params.get("mid");  // merchant id
  const ref = params.get("ref");          // reference

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // validation
  if (!type || !merchantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Invalid QR Code</p>
      </div>
    );
  }

  // fetch merchant
  useEffect(() => {
    const fetchMerchant = async () => {
      try {
        const res = await fetch(`/api/pay/merchant?mid=${merchantId}`);
        if (!res.ok) throw new Error("Merchant not found");

        const data = await res.json();
        setMerchant(data);
      } catch (err) {
        setError("Unable to load merchant");
      } finally {
        setLoading(false);
      }
    };

    fetchMerchant();
  }, [merchantId]);

  // submit payment
  const handlePay = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("Enter valid amount");
      return;
    }

    const res = await fetch("/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantId,
        amount: Number(amount),
        ref,
      }),
    });

    if (res.ok) {
      setSuccess(true);
    } else {
      setError("Payment failed");
    }
  };

  // loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading merchant…</p>
      </div>
    );
  }

  // error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // success
  if (success) {
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
  }

  // main UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow">

        {/* Merchant Info */}
        <div className="text-center mb-6">
          {merchant?.logoUrl && (
            <img
              src={merchant.logoUrl}
              alt="logo"
              className="mx-auto h-16 w-16 rounded-full mb-2"
            />
          )}
          <h1 className="text-xl font-semibold">
            Pay {merchant?.businessName}
          </h1>
        </div>

        {/* Amount */}
        {type === "merchant" && (
          <div className="mb-4">
            <label className="block text-sm mb-1">Enter Amount (PKR)</label>
            <input
              type="number"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePay}
          className="w-full rounded-xl bg-green-600 py-2 text-white font-medium hover:bg-green-700 transition"
        >
          Pay Now
        </button>
      </div>
    </div>
  );
}
