"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textArea";
import { showToast } from "../app/lib/toastMessage";
import { zodErrorMessage } from "../app/lib/apiErrors";

type Props = {
  transactionId: number;
  hasDispute: boolean;
  canDispute: boolean;
};

function disputeErrorMessage(status: number, body: unknown): string {
  if (status === 409) return "A dispute already exists for this transaction";
  if (status === 404) return "Transaction not found";
  if (status === 500) return "Something went wrong. Please try again.";

  if (status === 400 && body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.error === "string") return record.error;
    if (record.error && typeof record.error === "object") {
      const err = record.error as {
        formErrors?: string[];
        fieldErrors?: { reason?: string[] };
      };
      return (
        err.formErrors?.[0] ||
        err.fieldErrors?.reason?.[0] ||
        zodErrorMessage(record.error as Parameters<typeof zodErrorMessage>[0])
      );
    }
  }

  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.error === "string") return record.error;
  }

  return "Could not file dispute";
}

export function MerchantPaymentDisputeActions({
  transactionId,
  hasDispute,
  canDispute,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (hasDispute) {
    return (
      <span className="text-xs font-medium text-muted-foreground">
        Dispute filed
      </span>
    );
  }

  if (!canDispute) {
    return null;
  }

  const submit = async () => {
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setError("Reason must be at least 5 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantTransactionId: Number(transactionId),
          reason: trimmed,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(disputeErrorMessage(res.status, body));
        return;
      }
      setOpen(false);
      setReason("");
      setSuccess(true);
      showToast("success", "Dispute submitted successfully. We'll review it within 24 hours.");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <div className="flex flex-col items-end gap-1">
        {success && (
          <p className="text-xs text-green-600">
            Dispute submitted successfully. We&apos;ll review it within 24 hours.
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-8"
          onClick={() => setOpen(true)}
        >
          Raise Dispute
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 w-full sm:max-w-md rounded-md border border-border bg-muted/30 p-3 space-y-2">
      <label className="text-xs font-medium">Dispute reason</label>
      <Textarea
        value={reason}
        onChange={(e) => {
          setReason(e.target.value);
          setError(null);
        }}
        rows={3}
        minLength={5}
        maxLength={2000}
        placeholder="Describe the issue (min 5 characters)"
        disabled={loading}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={loading}
          onClick={() => void submit()}
        >
          {loading ? "Submitting…" : "Submit dispute"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => {
            setOpen(false);
            setReason("");
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
