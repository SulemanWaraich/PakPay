"use client";

import { Download, Share2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { AlertTriangle, ShieldAlert, FileText } from "lucide-react";
import { redirect } from "next/navigation";


type Merchant = {
  id: number;
  businessName: string | null;
  qrPayload: string | null;
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
};

const QRCodePage = () => {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------
  // 🔥 Fetch merchant data + determine QR eligibility
  // --------------------------------------------------
  useEffect(() => {
    const fetchMerchant = async () => {
      try {
        const res = await fetch("/api/qr");

        if (res.status === 401) {
          redirect("/auth/signin")
        }

        const data = await res.json();

        // ❌ Merchant has no business profile at all
        if (res.status === 403 && data.error === "QR not available") {
          setError("Please complete your business profile to generate a QR.");
          return;
        }

        // Store merchant 
        setMerchant(data);

        // ❌ If QR payload missing → KYC not verified yet
        if (!data.qrPayload || data.qrPayload.trim() === "") {
          setError("Your business verification is pending. QR will appear once approved.");
          return;
        }

        // --------------------------------------------------
        // ✔ Generate QR image ONLY if merchant is verified
        // --------------------------------------------------
        if (data.kycStatus !== "VERIFIED") {
          setError("Your KYC is pending. QR will unlock after approval.");
          return;
        }

        // ✔ Now safe to generate QR code
        const qrImage = await QRCode.toDataURL(data.qrPayload, {
          width: 300,
          margin: 2,
        });

        setQr(qrImage);

      } catch (err) {
        console.error(err);
        setError("Failed to load your QR code.");
      } finally {
        setLoading(false);
      }
    };

    fetchMerchant();
  }, []);

  // --------------------------------------------------
  // ⬇️ Download QR
  // --------------------------------------------------
  const downloadQR = useCallback(() => {
    if (!qr) return;

    const link = document.createElement("a");
    link.href = qr;
    link.download = "pakpay-merchant-qr.png";
    link.click();
  }, [qr]);

  // --------------------------------------------------
  // 📤 Share QR or copy payload
  // --------------------------------------------------
  const handleShare = useCallback(async () => {
    if (!merchant) return;

    if (navigator.share) {
      await navigator.share({
        title: "PakPay Merchant QR",
        text: `Pay ${merchant.businessName} via PakPay`,
      });
    } else {
      await navigator.clipboard.writeText(merchant.qrPayload || "");
      alert("Payment payload copied to clipboard");
    }
  }, [merchant]);

  // --------------------------------------------------
  // 🔄 Loading State
  // --------------------------------------------------
 if (loading) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-8 py-6 shadow-md">

        {/* Spinner */}
        <div className="h-10 w-10 rounded-full border-4 border-muted border-t-green-600 animate-spin" />

        {/* Text */}
        <p className="text-sm font-medium text-muted-foreground">
          Generating your secure QR code…
        </p>
      </div>
    </div>
  );
}

  // --------------------------------------------------
  // ⚠️ Early Failure States 
  // (No profile, pending KYC, missing QR)
  // --------------------------------------------------
 if (error) {
  const isProfileError = error.includes("business profile");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 w-full animate-in fade-in zoom-in duration-400">
      <div className="w-full max-w-xl rounded-2xl border bg-card shadow-lg p-10 text-center">

        {/* ICON */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          {isProfileError ? (
            <FileText className="h-7 w-7 text-red-500" />
          ) : (
            <ShieldAlert className="h-7 w-7 text-red-500" />
          )}
        </div>

        {/* TITLE */}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Action Required
        </h2>

        {/* MESSAGE */}
        <p className="text-base text-muted-foreground mb-6">
          {error}
        </p>

        {/* CTA */}
        {isProfileError && (
          <a
            href="/merchant/business-profile"
            className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition"
          >
            Complete Business Profile
          </a>
        )}
      </div>
    </div>
  );
}


  // --------------------------------------------------
  // 🟢 VERIFIED → Show QR Code
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 w-full">

      <div className="w-full max-w-2xl bg-card rounded-2xl border shadow p-8">

        <h1 className="text-2xl font-semibold text-center mb-8">
          Merchant QR Code
        </h1>

        {/* QR IMAGE */}
        <div className="flex justify-center mb-8">
          <div className="bg-muted rounded-xl p-4">
            <img src={qr!} alt="Merchant QR" className="w-[260px] h-[260px]" />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-4 mb-8 ">
          <div className="flex items-center justify-center gap-1 flex-1">
          <Download className="w-5 h-5" />
          <button onClick={downloadQR} className="btn-primary">
            Download
          </button>
        </div>

        <div className="flex items-center justify-center gap-1 flex-1">

          <Share2 className="w-5 h-5" />
          <button onClick={handleShare} className="btn-primary">
            Share
          </button>
        </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">How to Use</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Customers can scan this QR to pay you instantly.</li>
            <li>• Print and display it at your shop counter.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;
