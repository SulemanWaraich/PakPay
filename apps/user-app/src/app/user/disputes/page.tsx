"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textArea";

type DisputeRow = {
  id: number;
  status: string;
  reason: string;
  merchantTransaction: { id: number; amount: number; status: string };
};

export default function UserDisputesPage() {
  const [rows, setRows] = useState<DisputeRow[]>([]);
  const [txnId, setTxnId] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/disputes");
    if (res.ok) setRows(await res.json());
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async () => {
    setMsg(null);
    const id = Number.parseInt(txnId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      setMsg("Enter a valid merchant transaction ID.");
      return;
    }
    const res = await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantTransactionId: id, reason }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error ?? "Could not open dispute.");
      return;
    }
    setTxnId("");
    setReason("");
    setMsg("Dispute submitted.");
    void load();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Disputes</h1>
      <p className="text-sm text-muted-foreground">
        Open a dispute for a merchant payment you made (SUCCESS only). Include the transaction ID from your history.
      </p>

      <div className="space-y-3 border rounded-lg p-4">
        <div>
          <label className="text-sm font-medium">Merchant transaction ID</label>
          <Input value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="e.g. 42" />
        </div>
        <div>
          <label className="text-sm font-medium">Reason</label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
        </div>
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        <Button onClick={() => void submit()}>Submit dispute</Button>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Your disputes</h2>
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="border rounded p-2">
              <div className="font-medium">#{r.id} — {r.status}</div>
              <div>Txn #{r.merchantTransaction.id} — PKR {r.merchantTransaction.amount}</div>
              <div className="text-muted-foreground">{r.reason}</div>
            </li>
          ))}
          {rows.length === 0 && <li className="text-muted-foreground">No disputes yet.</li>}
        </ul>
      </div>
    </div>
  );
}
