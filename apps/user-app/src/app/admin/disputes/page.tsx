"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textArea";
import { showToast } from "../../lib/toastMessage";
import { cn } from "../../lib/utils";

type DisputeStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "REJECTED";

type FilterTab = "ALL" | DisputeStatus;

type AdminDispute = {
  id: number;
  reason: string;
  status: DisputeStatus;
  createdAt: string;
  resolvedAt: string | null;
  adminNotes: string | null;
  MerchantTransaction: {
    id: number;
    amount: number;
    status: string;
    createdAt: string;
    ref: string | null;
    paymentMethod: string;
    merchant: { businessName: string | null };
  };
  user: {
    id: number;
    name: string | null;
    number: string;
  };
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "REJECTED", label: "Rejected" },
];

function formatDisputeDate(iso: string) {
  return format(new Date(iso), "dd MMM yyyy, h:mm a");
}

function DisputeStatusBadge({ status }: { status: DisputeStatus }) {
  const styles: Record<DisputeStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    UNDER_REVIEW: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  const labels: Record<DisputeStatus, string> = {
    PENDING: "Pending",
    UNDER_REVIEW: "Under Review",
    RESOLVED: "Resolved",
    REJECTED: "Rejected",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}

function ReasonText({ reason }: { reason: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = reason.length > 120;
  const display =
    !long || expanded ? reason : `${reason.slice(0, 120).trimEnd()}…`;

  return (
    <p className="text-sm text-foreground">
      <span className="font-medium">Reason:</span> {display}
      {long && !expanded && (
        <button
          type="button"
          className="ml-1 text-green-700 hover:underline"
          onClick={() => setExpanded(true)}
        >
          show more
        </button>
      )}
    </p>
  );
}

type CardActionState = {
  actionLoading: boolean;
  showConfirm: boolean;
  confirmType: "REFUND" | "REJECT" | null;
  note: string;
  inlineError: string | null;
};

const initialActionState = (): CardActionState => ({
  actionLoading: false,
  showConfirm: false,
  confirmType: null,
  note: "",
  inlineError: null,
});

export default function AdminDisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [filter, setFilter] = useState<FilterTab>("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<number, CardActionState>>(
    {},
  );

  const getActionState = (id: number): CardActionState =>
    actionState[id] ?? initialActionState();

  const setCardAction = (id: number, patch: Partial<CardActionState>) => {
    setActionState((prev) => ({
      ...prev,
      [id]: { ...getActionState(id), ...patch },
    }));
  };

  const fetchDisputes = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/disputes");
      if (res.status === 401 || res.status === 403) {
        router.push("/auth/signin");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDisputes(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load disputes. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchDisputes();
  }, [fetchDisputes]);

  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = {
      ALL: disputes.length,
      PENDING: 0,
      UNDER_REVIEW: 0,
      RESOLVED: 0,
      REJECTED: 0,
    };
    for (const d of disputes) {
      c[d.status] += 1;
    }
    return c;
  }, [disputes]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return disputes;
    return disputes.filter((d) => d.status === filter);
  }, [disputes, filter]);

  const filterEmptyLabel =
    filter === "ALL"
      ? ""
      : filter === "UNDER_REVIEW"
        ? "under review"
        : filter.toLowerCase();

  const handleRefund = async (dispute: AdminDispute) => {
    const state = getActionState(dispute.id);
    setCardAction(dispute.id, { actionLoading: true, inlineError: null });
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disputeId: dispute.id,
          action: "REFUND",
          note: state.note.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg =
          typeof body.error === "string" ? body.error : "Refund failed";
        if (
          res.status === 400 &&
          errMsg.toLowerCase().includes("insufficient balance")
        ) {
          setDisputes((prev) =>
            prev.map((d) =>
              d.id === dispute.id
                ? { ...d, status: "UNDER_REVIEW" as const }
                : d,
            ),
          );
          setCardAction(dispute.id, {
            showConfirm: false,
            confirmType: null,
            note: "",
            inlineError:
              "Merchant has insufficient balance. Dispute moved to Under Review.",
          });
          return;
        }
        throw new Error(errMsg);
      }
      setDisputes((prev) =>
        prev.map((d) =>
          d.id === dispute.id ? { ...d, status: "RESOLVED" as const } : d,
        ),
      );
      setCardAction(dispute.id, initialActionState());
      showToast("success", "Refund processed successfully");
    } catch (e) {
      showToast(
        "error",
        e instanceof Error ? e.message : "Failed to process refund",
      );
    } finally {
      setCardAction(dispute.id, { actionLoading: false });
    }
  };

  const handleReject = async (dispute: AdminDispute) => {
    const state = getActionState(dispute.id);
    const note = state.note.trim();
    if (!note) {
      setCardAction(dispute.id, {
        inlineError: "Please enter a reason for rejection.",
      });
      return;
    }
    setCardAction(dispute.id, { actionLoading: true, inlineError: null });
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disputeId: dispute.id,
          action: "REJECT",
          note,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof body.error === "string" ? body.error : "Rejection failed",
        );
      }
      setDisputes((prev) =>
        prev.map((d) =>
          d.id === dispute.id ? { ...d, status: "REJECTED" as const } : d,
        ),
      );
      setCardAction(dispute.id, initialActionState());
      showToast("success", "Dispute rejected");
    } catch (e) {
      showToast(
        "error",
        e instanceof Error ? e.message : "Failed to reject dispute",
      );
    } finally {
      setCardAction(dispute.id, { actionLoading: false });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center p-6">
        <p className="text-muted-foreground">Loading disputes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button className="mt-4" variant="outline" onClick={() => fetchDisputes()}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 w-full">
      <h1 className="text-2xl font-bold">Disputes</h1>

      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(tab.key)}
            className="gap-2"
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                filter === tab.key
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {counts[tab.key]}
            </span>
          </Button>
        ))}
      </div>

      {disputes.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No disputes have been filed yet
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No {filterEmptyLabel} disputes
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((dispute) => {
            const txn = dispute.MerchantTransaction;
            const merchantName =
              txn.merchant.businessName?.trim() || "Unknown merchant";
            const userName = dispute.user.name?.trim() || "Unknown user";
            const state = getActionState(dispute.id);
            const canAct =
              dispute.status === "PENDING" || dispute.status === "UNDER_REVIEW";

            return (
              <div
                key={dispute.id}
                className="rounded-lg border border-border bg-card p-4 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">Dispute #{dispute.id}</span>
                    <DisputeStatusBadge status={dispute.status} />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Filed: {formatDisputeDate(dispute.createdAt)}
                  </span>
                </div>

                <p className="text-sm">
                  Filed by: {userName} ({dispute.user.number})
                </p>

                <ReasonText reason={dispute.reason} />

                <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                  <p>
                    <span className="font-medium">Merchant:</span> {merchantName}
                  </p>
                  <p>
                    <span className="font-medium">Amount:</span> Rs.{" "}
                    {txn.amount.toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Method:</span> {txn.paymentMethod}
                  </p>
                  <p>
                    <span className="font-medium">Ref:</span> {txn.ref ?? "—"}
                  </p>
                  <p>
                    <span className="font-medium">Txn date:</span>{" "}
                    {formatDisputeDate(txn.createdAt)}
                  </p>
                </div>

                {dispute.adminNotes && (
                  <p className="text-sm">
                    <span className="font-medium">Admin note:</span>{" "}
                    {dispute.adminNotes}
                  </p>
                )}

                {dispute.resolvedAt && (
                  <p className="text-sm text-muted-foreground">
                    Resolved: {formatDisputeDate(dispute.resolvedAt)}
                  </p>
                )}

                {canAct && !state.showConfirm && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={state.actionLoading}
                      onClick={() =>
                        setCardAction(dispute.id, {
                          showConfirm: true,
                          confirmType: "REFUND",
                          note: "",
                          inlineError: null,
                        })
                      }
                    >
                      Refund Customer
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={state.actionLoading}
                      onClick={() =>
                        setCardAction(dispute.id, {
                          showConfirm: true,
                          confirmType: "REJECT",
                          note: "",
                          inlineError: null,
                        })
                      }
                    >
                      Reject Dispute
                    </Button>
                  </div>
                )}

                {canAct && state.showConfirm && state.confirmType === "REFUND" && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-4 space-y-3">
                    <p className="text-sm font-medium">
                      Refund Rs. {txn.amount.toLocaleString()} to {userName}?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This will debit {merchantName}&apos;s balance.
                    </p>
                    <Textarea
                      placeholder="Admin note (optional)"
                      maxLength={200}
                      value={state.note}
                      onChange={(e) =>
                        setCardAction(dispute.id, { note: e.target.value })
                      }
                      rows={2}
                      disabled={state.actionLoading}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={state.actionLoading}
                        onClick={() => void handleRefund(dispute)}
                      >
                        {state.actionLoading ? "Processing…" : "Confirm Refund"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={state.actionLoading}
                        onClick={() => setCardAction(dispute.id, initialActionState())}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {canAct && state.showConfirm && state.confirmType === "REJECT" && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-4 space-y-3">
                    <label className="text-sm font-medium block">
                      Reason for rejection <span className="text-red-600">*</span>
                    </label>
                    <Textarea
                      placeholder="Reason for rejection"
                      maxLength={200}
                      value={state.note}
                      onChange={(e) =>
                        setCardAction(dispute.id, { note: e.target.value })
                      }
                      rows={3}
                      disabled={state.actionLoading}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={state.actionLoading}
                        onClick={() => void handleReject(dispute)}
                      >
                        {state.actionLoading
                          ? "Processing…"
                          : "Confirm Rejection"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={state.actionLoading}
                        onClick={() => setCardAction(dispute.id, initialActionState())}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {state.inlineError && (
                  <p className="text-sm text-red-600">{state.inlineError}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
