"use client";

import { useState } from "react";
import { Button } from "@repo/ui";
import { Card } from "@repo/ui";
import { TextInput } from "@repo/ui";
import { showToast } from "../../lib/toastMessage";

interface DisputeFormProps {
  transactionId: number;
  onDisputeFiled: () => void;
}

export const DisputeForm = ({ transactionId, onDisputeFiled }: DisputeFormProps) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      showToast("error", "Please provide a reason for the dispute");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          reason: reason.trim(),
          description: description.trim() || undefined
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to file dispute");
      }

      showToast("success", "Dispute filed successfully");
      setReason("");
      setDescription("");
      onDisputeFiled();
    } catch (error: any) {
      showToast("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="File a Dispute">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="">Select a reason</option>
            <option value="UNAUTHORIZED_CHARGE">Unauthorized charge</option>
            <option value="INCORRECT_AMOUNT">Incorrect amount</option>
            <option value="DUPLICATE_CHARGE">Duplicate charge</option>
            <option value="SERVICE_NOT_RECEIVED">Service not received</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide additional details about your dispute..."
            className="w-full p-2 border rounded-md h-24 resize-none"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Filing Dispute..." : "File Dispute"}
        </Button>
      </form>
    </Card>
  );
};