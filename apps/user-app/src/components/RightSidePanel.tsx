// RightSidePanel.tsx
import { BalanceCard } from "./BalanceCard";
import { OnRampTransactions } from "./onRampTransaction"; 
import { OffRampTransactions } from "./OffRampTransaction";

export function RightSidePanel({ balance, transactions, type }: any) {
  return (
    <div className="flex flex-col gap-4">
      <BalanceCard amount={balance?.amount || 0} locked={balance?.locked || 0} />

      <div className="bg-white shadow-md rounded-lg p-4">
        <h2 className="text-lg font-bold mb-2">Recent Transactions</h2>
        {type === "deposit" ? (
          <OnRampTransactions transactions={transactions} />
        ) : (
          <OffRampTransactions transactions={transactions} />
        )}
      </div>
    </div>
  );
}
