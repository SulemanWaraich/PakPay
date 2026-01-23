"use client";

import { QRCodeSVG } from "qrcode.react";
import { Download, Share2 } from "lucide-react";
import { useRef, useCallback, useEffect, useState } from "react";
import { log } from "util";

type Merchant = {
  id: number;
  name: string;
  qrPayload: string;
};

const Index = () => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Fetch merchant from DB
  useEffect(() => {
    const fetchMerchant = async () => {
     try {
      const res = await fetch("/api/qr");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMerchant(data);
    } catch {
      setError("Failed to load merchant QR");
    } finally {
      setLoading(false);
    }
  };

    fetchMerchant();
  }, []);

console.log(merchant, merchant?.qrPayload)
  const handleDownload = useCallback(() => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "pakpay-merchant-qr.png";
      link.href = pngFile;
      link.click();
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  const handleShare = useCallback(async () => {
    if (!merchant) return;

    if (navigator.share) {
      await navigator.share({
        title: "PakPay Merchant QR Code",
        text: `Pay ${merchant.name} via PakPay`,
      });
    } else {
      await navigator.clipboard.writeText(merchant.qrPayload);
      alert("QR payment link copied to clipboard");
    }
  }, [merchant]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading QR Code...
      </div>
    );
  }

  if (error || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 mx-auto">
      <div className="w-full max-w-xl bg-card rounded-2xl border-2 border-pakpay-light shadow-pakpay-card p-8">
        <h1 className="text-2xl font-semibold text-center mb-8">
          Merchant QR Code
        </h1>

        <div className="flex justify-center mb-8">
          <div
            ref={qrRef}
            className="relative bg-pakpay-pale border-2 border-pakpay-light rounded-xl p-6"
          >
            <QRCodeSVG
              value={merchant.qrPayload}
              size={240}
              level="M"
              fgColor="hsl(140, 25%, 15%)"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="bg-pakpay-pale px-2 py-0.5 text-pakpay-medium font-semibold text-sm">
                PakPay
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <button onClick={handleDownload} className="flex-1 btn-primary">
            <Download className="w-5 h-5" />
            Download QR Code
          </button>

          <button onClick={handleShare} className="flex-1 btn-primary">
            <Share2 className="w-5 h-5" />
            Share QR Code
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">How to Use</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Scan the code with any payment app to make a secure payment.</li>
            <li>• Display this QR code at your point of sale.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Index;
