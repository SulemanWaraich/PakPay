"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { showToast } from "../../lib/toastMessage";

type KycStatus = "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";

type AdminMerchant = {
  id: number;
  businessName: string | null;
  category: string | null;
  address: string | null;
  kycStatus: KycStatus;
  logoUrl: string | null;
  cnicFrontUrl: string | null;
  cnicBackUrl: string | null;
  proofOfAddressUrl: string | null;
};

type FilterTab = "ALL" | "SUBMITTED" | "VERIFIED" | "REJECTED" | "PENDING";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "SUBMITTED", label: "Awaiting Review" },
  { key: "VERIFIED", label: "Verified" },
  { key: "REJECTED", label: "Rejected" },
  { key: "PENDING", label: "Pending" },
];

function KycStatusBadge({ status }: { status: KycStatus }) {
  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          Pending
        </span>
      );
    case "SUBMITTED":
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
          Awaiting Review
        </span>
      );
    case "VERIFIED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Verified
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
          Rejected
        </span>
      );
    default:
      return <span className="text-muted-foreground">—</span>;
  }
}

function MerchantLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const letter = (name.trim()[0] ?? "?").toUpperCase();
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        className="h-10 w-10 rounded-full object-cover border border-border"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
      {letter}
    </div>
  );
}

function KycDocuments({ merchant }: { merchant: AdminMerchant }) {
  const links: { href: string; label: string }[] = [];
  if (merchant.cnicFrontUrl) {
    links.push({ href: merchant.cnicFrontUrl, label: "CNIC Front" });
  }
  if (merchant.cnicBackUrl) {
    links.push({ href: merchant.cnicBackUrl, label: "CNIC Back" });
  }
  if (merchant.proofOfAddressUrl) {
    links.push({ href: merchant.proofOfAddressUrl, label: "Address Proof" });
  }
  if (links.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-col gap-1 text-sm">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-700 hover:underline"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export default function AdminKycPage() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("SUBMITTED");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchMerchants = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/merchants");
      if (res.status === 401 || res.status === 403) {
        router.push("/auth/signin");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load merchants");
      }
      const data = await res.json();
      setMerchants(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load merchants. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const filteredMerchants = useMemo(() => {
    if (activeTab === "ALL") return merchants;
    return merchants.filter((m) => m.kycStatus === activeTab);
  }, [merchants, activeTab]);

  const handleApprove = async (merchantId: number) => {
    setProcessingId(merchantId);
    setRejectingId(null);
    setRejectReason("");
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId, action: "APPROVE" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || "Approval failed");
      }
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === merchantId ? { ...m, kycStatus: "VERIFIED" as const } : m,
        ),
      );
      showToast("success", body.message || "Merchant verified successfully.");
    } catch (e) {
      showToast(
        "error",
        e instanceof Error ? e.message : "Failed to approve merchant.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (merchantId: number) => {
    const reason = rejectReason.trim();
    if (!reason) {
      showToast("warn", "Please enter a rejection reason.");
      return;
    }
    setProcessingId(merchantId);
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId, action: "REJECT", reason }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || "Rejection failed");
      }
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === merchantId ? { ...m, kycStatus: "REJECTED" as const } : m,
        ),
      );
      setRejectingId(null);
      setRejectReason("");
      showToast("success", body.message || "Merchant rejected.");
    } catch (e) {
      showToast(
        "error",
        e instanceof Error ? e.message : "Failed to reject merchant.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-8 py-6 shadow-md">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-green-600" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading merchants…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button className="mt-4" variant="outline" onClick={() => fetchMerchants()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Merchant KYC Review</h1>

      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto rounded-lg border border-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-left">Logo</th>
              <th className="px-4 py-2 text-left">Business name</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Address</th>
              <th className="px-4 py-2 text-left">KYC status</th>
              <th className="px-4 py-2 text-left">KYC documents</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMerchants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No merchants found
                </td>
              </tr>
            ) : (
              filteredMerchants.map((m) => {
                const displayName = m.businessName?.trim() || "Unnamed Business";
                return (
                  <tr key={m.id} className="border-t border-border align-top">
                    <td className="px-4 py-3">
                      <MerchantLogo name={displayName} logoUrl={m.logoUrl} />
                    </td>
                    <td className="px-4 py-3">{displayName}</td>
                    <td className="px-4 py-3">{m.category ?? "—"}</td>
                    <td className="px-4 py-3 max-w-xs">{m.address ?? "—"}</td>
                    <td className="px-4 py-3">
                      <KycStatusBadge status={m.kycStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <KycDocuments merchant={m} />
                    </td>
                    <td className="px-4 py-3 min-w-[200px]">
                      {m.kycStatus === "SUBMITTED" && (
                        <div className="flex flex-col gap-2">
                          {rejectingId === m.id ? (
                            <>
                              <Input
                                placeholder="Rejection reason…"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                disabled={processingId === m.id}
                              />
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={processingId === m.id}
                                  onClick={() => handleReject(m.id)}
                                >
                                  Confirm reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={processingId === m.id}
                                  onClick={() => {
                                    setRejectingId(null);
                                    setRejectReason("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                disabled={processingId === m.id}
                                onClick={() => handleApprove(m.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={processingId === m.id}
                                onClick={() => {
                                  setRejectingId(m.id);
                                  setRejectReason("");
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                      {m.kycStatus === "VERIFIED" && (
                        <span className="text-sm text-muted-foreground">Approved</span>
                      )}
                      {m.kycStatus === "REJECTED" && (
                        <span className="text-sm text-muted-foreground">Rejected</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
