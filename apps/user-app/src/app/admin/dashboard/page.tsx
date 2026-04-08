"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { CheckCircle2, XCircle, Download, AlertTriangle, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "../../../components/ui/card";

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

interface Dispute {
  id: number;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
  transaction: {
    amount: number;
    merchant: { user: { name: string } };
  };
}

interface Transaction {
  id: number;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  merchant: { user: { name: string } };
  customer: { name: string } | null;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"kyc" | "disputes" | "transactions">("kyc");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch merchants
        const merchantsRes = await fetch("/api/admin/merchants");
        if (merchantsRes.status === 403){
          router.push("/auth/signin");
          return;
        }
        if (!merchantsRes.ok) {
          const msg = await merchantsRes.text();
          throw new Error(msg || "Failed to load merchants");
        }
        const merchantsData = await merchantsRes.json();
        setMerchants(merchantsData);

        // Fetch disputes
        const disputesRes = await fetch("/api/admin/disputes");
        if (disputesRes.ok) {
          const disputesData = await disputesRes.json();
          setDisputes(disputesData.disputes);
        }

        // Fetch recent transactions
        const transactionsRes = await fetch("/api/admin/transactions");
        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json();
          setTransactions(transactionsData.transactions);
        }

      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  if (error) return <div className="p-6 text-red-500 text-center text-xl w-full">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("kyc")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "kyc"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          KYC Management ({merchants.filter(m => m.kycStatus === "PENDING").length})
        </button>
        <button
          onClick={() => setActiveTab("disputes")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "disputes"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Disputes ({disputes.filter(d => d.status === "PENDING").length})
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "transactions"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Transactions
        </button>
      </div>

      {/* KYC Tab */}
      {activeTab === "kyc" && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Merchant KYC Management</h2>
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
        </Card>
      )}

      {/* Disputes Tab */}
      {activeTab === "disputes" && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Transaction Disputes</h2>
          <div className="space-y-4">
            {disputes.length === 0 ? (
              <p className="text-gray-500">No disputes found.</p>
            ) : (
              disputes.map((dispute) => (
                <div key={dispute.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">Dispute #{dispute.id}</h3>
                      <p className="text-sm text-gray-600">
                        {dispute.user.name} ({dispute.user.email}) - {dispute.transaction.merchant.user.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Amount: ${dispute.transaction.amount} | Reason: {dispute.reason}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dispute.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        dispute.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800' :
                        dispute.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {dispute.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {dispute.description && (
                    <p className="text-sm text-gray-700 mb-3">{dispute.description}</p>
                  )}
                  {dispute.status === "PENDING" && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleDisputeAction(dispute.id, "REVIEW")}
                        disabled={processingId === dispute.id}
                      >
                        Under Review
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleDisputeAction(dispute.id, "RESOLVE")}
                        disabled={processingId === dispute.id}
                      >
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDisputeAction(dispute.id, "REJECT")}
                        disabled={processingId === dispute.id}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border border-border rounded-lg">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Merchant</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Method</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-t border-border">
                    <td className="px-4 py-2">#{txn.id}</td>
                    <td className="px-4 py-2">{txn.merchant.user.name}</td>
                    <td className="px-4 py-2">{txn.customer?.name || "N/A"}</td>
                    <td className="px-4 py-2">${txn.amount}</td>
                    <td className="px-4 py-2">{txn.paymentMethod}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        txn.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                        txn.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{new Date(txn.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}