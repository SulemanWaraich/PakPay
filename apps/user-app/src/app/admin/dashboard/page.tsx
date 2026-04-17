"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { CheckCircle2, XCircle, Download } from "lucide-react";
import { useRouter } from "next/navigation";

interface Merchant {
  id: number;
  businessName: string;
  category: string;
  address: string;
  kycStatus: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
  qrPayload: string | null;
  qrImage?: string | null;
  logoUrl?: string | null;
}

type TxSnapshot = {
  onRamp: { id: number; amount: number; status: string; user?: { email: string | null } }[];
  offRamp: { id: number; amount: number; status: string; user?: { email: string | null } }[];
  merchant: {
    id: number;
    amount: number;
    status: string;
    customer?: { email: string | null };
    merchant?: { businessName: string | null };
  }[];
  disputes: {
    id: number;
    status: string;
    reason: string;
    MerchantTransaction: { id: number; amount: number };
    User: { email: string | null; id: number };
  }[];
};

export default function AdminDashboard() {
  const [tab, setTab] = useState<"kyc" | "monitor">("kyc");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [tx, setTx] = useState<TxSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const res = await fetch("/api/admin/merchants");
        if (res.status === 403) {
          router.push("/auth/signin");
          return;
        }
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Failed to load merchants");
        }
        const data = await res.json();
        setMerchants(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load merchants");
      } finally {
        setLoading(false);
      }
    };
    fetchMerchants();
  }, [router]);

  useEffect(() => {
    if (tab !== "monitor") return;
    let cancelled = false;
    (async () => {
      setTxLoading(true);
      try {
        const res = await fetch("/api/admin/transactions");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setTx(data);
      } catch {
        if (!cancelled) setTx(null);
      } finally {
        if (!cancelled) setTxLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const handleKycAction = async (merchantId: number, action: "APPROVE" | "REJECT") => {
    setProcessingId(merchantId);
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId, action }),
      });
      if (!res.ok) throw new Error();
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === merchantId
            ? { ...m, kycStatus: action === "APPROVE" ? "VERIFIED" : "REJECTED" }
            : m,
        ),
      );
    } catch {
      alert("Failed to update KYC status");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDispute = async (disputeId: number, action: "REFUND" | "REJECT") => {
    setProcessingId(disputeId);
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disputeId, action: action === "REFUND" ? "REFUND" : "REJECT" }),
      });
      if (!res.ok) throw new Error();
      const snap = await fetch("/api/admin/transactions");
      if (snap.ok) setTx(await snap.json());
    } catch {
      alert("Failed to resolve dispute");
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
          <div className="h-10 w-10 rounded-full border-4 border-muted border-t-green-600 animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500 text-center text-xl w-full">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        <Button variant={tab === "kyc" ? "default" : "outline"} onClick={() => setTab("kyc")}>
          Merchant KYC
        </Button>
        <Button variant={tab === "monitor" ? "default" : "outline"} onClick={() => setTab("monitor")}>
          Transactions &amp; disputes
        </Button>
      </div>

      {tab === "kyc" && (
        <>
          <h1 className="text-2xl font-bold">Merchant KYC</h1>
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
                      {m.logoUrl ? (
                        <img src={m.logoUrl} className="w-12 h-12 object-cover rounded" alt="" />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">{m.businessName}</td>
                    <td className="px-4 py-2">{m.category}</td>
                    <td className="px-4 py-2">{m.address}</td>
                    <td className="px-4 py-2">
                      {m.kycStatus === "VERIFIED" && (
                        <CheckCircle2 className="inline w-5 h-5 text-green-500" />
                      )}
                      {m.kycStatus === "REJECTED" && (
                        <XCircle className="inline w-5 h-5 text-red-500" />
                      )}
                      {(m.kycStatus === "PENDING" || m.kycStatus === "SUBMITTED") && (
                        <span className="text-yellow-600">{m.kycStatus}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 space-x-2">
                      {(m.kycStatus === "PENDING" || m.kycStatus === "SUBMITTED") && (
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
        </>
      )}

      {tab === "monitor" && (
        <>
          <h1 className="text-2xl font-bold">Monitoring</h1>
          {txLoading && <p className="text-muted-foreground">Loading snapshot…</p>}
          {tx && (
            <div className="space-y-8">
              <section>
                <h2 className="text-lg font-semibold mb-2">Merchant payments (recent)</h2>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">ID</th>
                        <th className="p-2 text-left">Amount</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Customer</th>
                        <th className="p-2 text-left">Merchant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tx.merchant.map((t) => (
                        <tr key={t.id} className="border-t">
                          <td className="p-2">{t.id}</td>
                          <td className="p-2">{t.amount}</td>
                          <td className="p-2">{t.status}</td>
                          <td className="p-2">{t.customer?.email ?? "—"}</td>
                          <td className="p-2">{t.merchant?.businessName ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-2">Open disputes</h2>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">ID</th>
                        <th className="p-2 text-left">Txn</th>
                        <th className="p-2 text-left">Amount</th>
                        <th className="p-2 text-left">User</th>
                        <th className="p-2 text-left">Reason</th>
                        <th className="p-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tx.disputes
                        .filter(
                          (d) =>
                            d.status === "PENDING" || d.status === "UNDER_REVIEW",
                        )
                        .map((d) => (
                          <tr key={d.id} className="border-t">
                            <td className="p-2">{d.id}</td>
                            <td className="p-2">{d.MerchantTransaction.id}</td>
                            <td className="p-2">{d.MerchantTransaction.amount}</td>
                            <td className="p-2">{d.User.email}</td>
                            <td className="p-2 max-w-xs truncate">{d.reason}</td>
                            <td className="p-2 space-x-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={processingId === d.id}
                                onClick={() => handleDispute(d.id, "REJECT")}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                disabled={processingId === d.id}
                                onClick={() => handleDispute(d.id, "REFUND")}
                              >
                                Refund
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-2">On-ramp / Off-ramp (recent)</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-2 text-sm">
                    <div className="font-medium mb-2">On-ramp</div>
                    <ul className="space-y-1 max-h-48 overflow-y-auto">
                      {tx.onRamp.map((o) => (
                        <li key={o.id}>
                          #{o.id} — {o.amount} — {o.status} — {o.user?.email}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border rounded-lg p-2 text-sm">
                    <div className="font-medium mb-2">Off-ramp</div>
                    <ul className="space-y-1 max-h-48 overflow-y-auto">
                      {tx.offRamp.map((o) => (
                        <li key={o.id}>
                          #{o.id} — {o.amount} — {o.status} — {o.user?.email}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
