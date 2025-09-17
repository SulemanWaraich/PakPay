// components/OffRampTransactions.tsx
import { Card } from "@repo/ui";
import React from "react";

export const OffRampTransactions = ({
  transactions,
}: {
  transactions: {
    time: Date;
    amount: number;
    status: string;
    bankAccount: string;
  }[];
}) => {
  if (!transactions?.length) {
    return (
      <Card title="Recent Withdrawals">
        <div className="text-center pb-8 pt-8">No Recent transactions</div>
      </Card>
    );
  }

  return (
    <Card title="Recent Withdrawals">
      <div className="pt-2">
        {transactions.map((t, i) => (
          <div key={i} className="flex justify-between py-2 border-b last:border-b-0">
            <div>
              <div className="text-sm">Withdrawn PKR</div>
              <div className="text-slate-600 text-xs">{new Date(t.time).toDateString()}</div>
              <div className="text-xs text-slate-500">{t.bankAccount}</div>
            </div>
            <div className="flex flex-col justify-center text-right">
              <div className="text-red-600">- Rs {t.amount / 100}</div>
              <div className="text-xs text-slate-500">{t.status}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
