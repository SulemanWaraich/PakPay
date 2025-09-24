"use client";

import React from "react";
import { AddMoney } from "./AddMoneyCard";
import dynamic from "next/dynamic";

const WithdrawMoney = dynamic(
  () => import("./WithDrawMoneyCard").then((m) => m.WithdrawMoney),
  { ssr: false }
);

type Props = {
  tab: "deposit" | "withdraw";
  setTab: (tab: "deposit" | "withdraw") => void;
};

export const TabsSwitcher = ({ tab, setTab }: Props) => {
  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          className={`sm:px-4 sm:py-2 px-2 py-1 rounded sm:text-base text-sm ${
            tab === "deposit" ? "bg-green-600 text-white" : "bg-white border"
          }`}
          onClick={() => setTab("deposit")}
        >
          Deposit
        </button>
        <button
          className={`sm:px-4 sm:py-2 px-2 py-1 rounded  sm:text-base text-sm ${
            tab === "withdraw" ? "bg-green-600 text-white" : "bg-white border"
          }`}
          onClick={() => setTab("withdraw")}
        >
          Withdraw
        </button>
      </div>

      {/* Only forms (no transactions now) */}
      {tab === "deposit" ? <AddMoney /> : <WithdrawMoney />}
    </div>
  );
};
