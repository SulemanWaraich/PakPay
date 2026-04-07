"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
// import { Separator } from "../../../components/ui/select";

// Types based fully on your Prisma schema
interface MerchantPayment {
  id: number;
  amount: number;
  paymentMethod: string;
  status: string;
  ref: string | null;
  createdAt: string;
  customer: {
    name: string | null;
    number: string;
  } | null;
  settled: boolean;
  settledAt: string | null;
}

interface Settlement {
  id: number;
  amount: number;
  status: string;
  scheduledFor: string;
  processedAt: string | null;
  createdAt: string;
}

export default function MerchantTransactionsPage() {
  const [payments, setPayments] = useState<MerchantPayment[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/merchant/transactions");
        const data = await res.json();

        setPayments(data.payments);
        setSettlements(data.settlements);
      } catch (error) {
        console.error("Error loading merchant transactions:", error);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  const filteredPayments =
    filter === "all" ? payments : payments.filter((p) => p.status === filter);

  const exportCSV = () => {
    const rows = [
      ["ID", "Amount", "Status", "Payment Method", "Customer", "Reference", "Date"],
      ...payments.map((p) => [
        p.id,
        p.amount / 100,
        p.status,
        p.paymentMethod,
        p.customer?.number ?? "N/A",
        p.ref ?? "N/A",
        format(new Date(p.createdAt), "PPpp"),
      ]),
    ];

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `merchant-transactions-${Date.now()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full mx-4">
      {/* Header */}
      <div className="flex justify-between items-center">
         <h1 className="pt-4 text-2xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
              Invoices
            </h1>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {["all", "SUCCESS", "PENDING", "FAILED"].map((key) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(key)}
          >
            {key === "all" ? "All" : key}
          </Button>
        ))}
      </div>

      {/* <Separator /> */}

      {/* Merchant Payments */}
      <h2 className="text-lg font-semibold text-green-600">Payments Received</h2>

      <Card className="p-4 space-y-2">
        {filteredPayments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No transactions found.
          </p>
        )}

        {filteredPayments.map((tx) => (
          <div key={tx.id} className="flex justify-between items-center py-3 border-b last:border-none">
            <div>
              <p className="font-medium">
                ₹{(tx.amount / 100).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                {tx.paymentMethod} • {format(new Date(tx.createdAt), "PPp")}
              </p>

              <p className="text-xs text-muted-foreground">
                Customer: {tx.customer?.number ?? "N/A"}
              </p>
            </div>

            <Badge
              variant={
                tx.status === "SUCCESS"
                  ? "default"
                  : tx.status === "FAILED"
                  ? "destructive"
                  : "secondary"
              }
            >
              {tx.status}
            </Badge>
          </div>
        ))}
      </Card>

      {/* Settlements */}
      <h2 className="text-lg font-semibold text-green-600">Settlements</h2>

      <Card className="p-4 space-y-2">
        {settlements.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No settlements yet.
          </p>
        )}

        {settlements.map((s) => (
          <div key={s.id} className="flex justify-between py-3 border-b last:border-none">
            <div>
              <p className="font-medium">Settlement ₹{(s.amount / 100).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                Created: {format(new Date(s.createdAt), "PPp")}
              </p>
              <p className="text-xs text-muted-foreground">
                Scheduled: {format(new Date(s.scheduledFor), "PPp")}
              </p>
            </div>

            <Badge
              variant={
                s.status === "SUCCESS"
                  ? "default"
                  : s.status === "FAILED"
                  ? "destructive"
                  : "secondary"
              }
            >
              {s.status}
            </Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}