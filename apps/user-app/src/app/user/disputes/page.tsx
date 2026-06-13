"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textArea";
import { apiErrorMessage } from "../../lib/apiErrors";
import { Card, CardContent, CardHeader} from "../../../components/ui/card"


type DisputeRow = {
  id: number;
  status: string;
  reason: string;
  MerchantTransaction?: { id: number; amount: number; status: string };
};

const EMPTY_STATE_MESSAGE =
  "No disputes yet. If you have an issue with a payment, you can raise a dispute from your transaction history.";

export default function UserDisputesPage() {
  const [rows, setRows] = useState<DisputeRow[]>([]);
  const [txnId, setTxnId] = useState("");
  const [reason, setReason] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/disputes");
      if (!res.ok) {
        setRows([]);
        return;
      }
      const data: unknown = await res.json();
      if (!Array.isArray(data)) {
        setRows([]);
        return;
      }
      setRows(data as DisputeRow[]);
    } catch {
      setRows([]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async () => {
    setSuccessMsg(null);
    setErrorMsg(null);
    const id = Number.parseInt(txnId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      setErrorMsg("Enter a valid merchant transaction ID.");
      return;
    }
    const res = await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantTransactionId: id, reason }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErrorMsg(apiErrorMessage(j, "Could not open dispute."));
      return;
    }
    setTxnId("");
    setReason("");
    setSuccessMsg("Dispute submitted.");
    void load();
  };

  return (
    <div className="max-w-6xl  p-4 space-y-8 flex flex-col items-center justify-center">
      {/* <h1 className="text-2xl sm:text-4xl font-bold text-green-600">Disputes</h1>
      <p className="text-sm text-muted-foreground">
        Open a dispute for a merchant payment you made (SUCCESS only). Include the transaction ID from your history.
      </p> */}

     

<Card className="w-full max-w-4xl px-4 py-2 border-2 border-gray-200 rounded-lg"> 
  <CardHeader>
  <div className=" min-w-0 sm:text-left text-center">
        <div className="sm:text-4xl text-2xl text-green-600 pt-4 font-bold ml-2 mb-1">
          Disputes
        </div>
        <p className="text-gray-600 sm:text-md text-sm ml-2">
          Open a dispute for a merchant payment you made (SUCCESS only). Include the transaction ID from your history.
        </p>
      </div>
  </CardHeader>
  <CardContent>
      <div className="space-y-3 border rounded-lg p-4 w-full max-w-4xl">
        <div>
          <label className="text-sm font-medium">Merchant transaction ID</label>
          <Input value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="e.g. 42" />
        </div>
        <div>
          <label className="text-sm font-medium">Reason</label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
        </div>
        {errorMsg && <p className="text-red-500 text-sm mt-1">{errorMsg}</p>}
        {successMsg && <p className="text-sm text-green-700">{successMsg}</p>}
        <Button onClick={() => void submit()}>Submit dispute</Button>
      </div>

      <div className="mt-4 max-w-4xl">
        <h2 className="font-semibold mb-2 text-lg text-green-600">Your disputes</h2>
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="border rounded-lg p-4">
              <div className="font-medium">#{r.id} — {r.status}</div>
              <div>
                Txn #{r.MerchantTransaction?.id ?? "—"} — PKR {r.MerchantTransaction?.amount ?? "—"}
              </div>
              <div className="text-muted-foreground">{r.reason}</div>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="text-muted-foreground">{EMPTY_STATE_MESSAGE}</li>
          )}
        </ul>
      </div>
      </CardContent>
      </Card>
    </div>
  );
}
