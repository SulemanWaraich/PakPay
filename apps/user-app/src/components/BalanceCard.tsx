import { Card } from "@repo/ui";
import { availableBalancePaisa, totalBalancePaisa } from "../app/lib/balance";

export const BalanceCard = ({ amount, locked }: { amount: number; locked: number }) => {
  const available = availableBalancePaisa(amount, locked);
  const total = totalBalancePaisa(amount, locked);

  const fmt = (paisa: number) =>
    (paisa / 100).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <Card title={"Balance"}>
      <div className="flex justify-between border-b border-slate-300 pb-2 sm:text-base text-sm">
        <div>Available Balance</div>
        <div>{fmt(available)} PKR</div>
      </div>
      <div className="flex justify-between border-b border-slate-300 py-2 sm:text-base text-sm">
        <div>Locked (in-flight)</div>
        <div>{fmt(locked)} PKR</div>
      </div>
      <div className="flex justify-between border-b border-slate-300 py-2 sm:text-base text-sm">
        <div>Total Balance</div>
        <div>{fmt(total)} PKR</div>
      </div>
    </Card>
  );
};