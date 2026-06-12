"use client";

import { useEffect, useState } from "react";
import ActivityChart from "../../../components/ChartMerchant";
import TopCustomers from "../../../components/TopCustomers";
import { Card, CardContent } from "../../../components/ui/card";

type DailyPoint = { date: string; amount: number };

type TopCustomer = {
  id: string;
  name: string;
  total: number;
  count: number;
  lastSeen: string;
};

// function mergeChartData(daily: DailyPoint[], dailySettled: DailyPoint[]) {
//   const revenueByDate = new Map(daily.map((d) => [d.date, d.amount]));
//   const settledByDate = new Map(dailySettled.map((d) => [d.date, d.amount]));
//   const allDates = new Set([
//     ...Array.from(revenueByDate.keys()),
//     ...Array.from(settledByDate.keys()),
//   ]);

//   return Array.from(allDates)
//     .sort()
//     .map((date) => ({
//       date,
//       revenue: revenueByDate.get(date) ?? 0,
//       settled: settledByDate.get(date) ?? 0,
//     }));
// }

export default function MerchantAnalyticsPage() {
  const [chartData, setChartData] = useState<
    { date: string; revenue: number; settled: number }[]
  >([]);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);
  const [uniqueCustomers, setUniqueCustomers] = useState(0);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/merchant/analytics");
      if (!res.ok) return;
      const j = await res.json();
      setTotal(j.totalRevenue ?? 0);
      setCount(j.transactionCount ?? 0);
      setUniqueCustomers(j.uniqueCustomerCount ?? 0);
      setTopCustomers(j.topCustomers ?? []);
      setChartData(
        ((j.daily as DailyPoint[]) ?? []).map((d) => ({
          date: d.date,
          revenue: d.amount,
          settled: 0,  // no settled line on analytics
        })),
      );
    })();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">Analytics (last 30 days)</h1>
      <p className="text-muted-foreground text-sm">
        Successful merchant payments only.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold">PKR {total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Transactions</p>
            <p className="text-2xl font-bold">{count.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Unique Customers</p>
            <p className="text-2xl font-bold">{uniqueCustomers.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <ActivityChart data={chartData} />
      <TopCustomers
        customers={topCustomers.map((c) => ({
          ...c,
          lastSeen: new Date(c.lastSeen),
        }))}
      />
    </div>
  );
}
