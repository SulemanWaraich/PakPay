"use client";

import { useEffect, useState } from "react";
import ActivityChart from "../../../components/ChartMerchant";

export default function MerchantAnalyticsPage() {
  const [daily, setDaily] = useState<{ date: string; revenue: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/merchant/analytics");
      if (!res.ok) return;
      const j = await res.json();
      setTotal(j.totalRevenue ?? 0);
      setCount(j.transactionCount ?? 0);
      setDaily(
        (j.daily as { date: string; amount: number }[]).map((d) => ({
          date: d.date,
          revenue: d.amount,
        })),
      );
    })();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">Analytics (last 30 days)</h1>
      <p className="text-muted-foreground text-sm">
        Successful merchant payments only. Total revenue: PKR {total} across {count}{" "}
        transactions.
      </p>
      <ActivityChart data={daily} />
    </div>
  );
}
