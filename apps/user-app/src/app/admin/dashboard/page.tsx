"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { CheckCircle2, XCircle, Download } from "lucide-react";

interface Merchant {
  id: number;
  businessName: string;
  category: string;
  address: string;
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  qrPayload: string | null;
  qrImage?: string | null;
  logoUrl?: string | null;
}

export default function AdminDashboard() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const res = await fetch("/api/admin/merchants");
        if (!res.ok) throw new Error("Failed to fetch merchants");

        const data = await res.json();
        setMerchants(data);
      } catch (err: any) {
        setError(err.message || "Failed to load merchants");
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, []);

  const handleKycAction = async (merchantId: number, action: "APPROVE" | "REJECT") => {
    setProcessingId(merchantId);
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId, action }),
      });
      if (!res.ok) throw new Error();

      // update locally
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === merchantId ? { ...m, kycStatus: action === "APPROVE" ? "VERIFIED" : "REJECTED" } : m
        )
      );
    } catch {
      alert("Failed to update KYC status");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownloadQr = (qrImage: string | null, businessName: string) => {
    if (!qrImage) return;
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `${businessName}_QR.png`;
    link.click();
  };

 if (loading) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-8 py-6 shadow-md">

        {/* Spinner */}
        <div className="h-10 w-10 rounded-full border-4 border-muted border-t-green-600 animate-spin" />

        {/* Text */}
        <p className="text-sm font-medium text-muted-foreground">
          Loading Merchants…
        </p>
      </div>
    </div>
  );
}

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard - Merchant KYC</h1>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-border rounded-lg">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2">Logo</th>
              <th className="px-4 py-2">Business</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Address</th>
              <th className="px-4 py-2">KYC</th>
              <th className="px-4 py-2">Actions</th>
              <th className="px-4 py-2">QR</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-2">
                  {m.logoUrl ? <img src={m.logoUrl} className="w-12 h-12 object-cover rounded" /> : "—"}
                </td>
                <td className="px-4 py-2">{m.businessName}</td>
                <td className="px-4 py-2">{m.category}</td>
                <td className="px-4 py-2">{m.address}</td>
                <td className="px-4 py-2">
                  {m.kycStatus === "VERIFIED" && <CheckCircle2 className="inline w-5 h-5 text-green-500" />}
                  {m.kycStatus === "REJECTED" && <XCircle className="inline w-5 h-5 text-red-500" />}
                  {m.kycStatus === "PENDING" && <span className="text-yellow-500">Pending</span>}
                </td>
                <td className="px-4 py-2 space-x-2">
                  {m.kycStatus === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleKycAction(m.id, "APPROVE")}
                        disabled={processingId === m.id}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleKycAction(m.id, "REJECT")}
                        disabled={processingId === m.id}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </td>
                <td className="px-4 py-2">
                  {m.kycStatus === "VERIFIED" && m.qrImage && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadQr(m.qrImage!, m.businessName)}
                    >
                      <Download className="w-4 h-4 mr-1" /> Download
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}