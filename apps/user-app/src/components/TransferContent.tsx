// TransferContent.tsx
"use client";
import React from "react";
import { TabsSwitcher } from "./TabSwitcher";
import { RightSidePanel } from "./RightSidePanel";

export function TransferContent({ balance, onrampTx, offrampTx }: any) {
  const [tab, setTab] = React.useState<"deposit" | "withdraw">("deposit");

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 p-4">
      {/* Left side */}
      <TabsSwitcher tab={tab} setTab={setTab} />

      {/* Right side */}
      <RightSidePanel
        balance={balance}
        transactions={tab === "deposit" ? onrampTx : offrampTx}
        type={tab}
      />
    </div>
  );
}
