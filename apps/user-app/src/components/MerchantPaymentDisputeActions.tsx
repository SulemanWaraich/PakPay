"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textArea";
import { showToast } from "../app/lib/toastMessage";

type Props = {
  transactionId: number;
  hasDispute: boolean;
  canDispute: boolean;
};

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
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantTransactionId: transactionId,
          reason: trimmed,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setError("A dispute already exists for this transaction");
        return;
      }
      if (!res.ok) {
        setError(
          typeof body.error === "string"
            ? body.error
            : "Could not file dispute",
        );
        return;
      }
      setOpen(false);
      setReason("");
      showToast("success", "Dispute filed successfully");
      router.refresh();
    } catch {
      setError("Could not file dispute. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-xs h-8"
        onClick={() => setOpen(true)}
      >
        Raise Dispute
      </Button>
    );
  }

  return (
    <div className="mt-2 w-full sm:max-w-md rounded-md border border-border bg-muted/30 p-3 space-y-2">
      <label className="text-xs font-medium">Dispute reason</label>
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
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
