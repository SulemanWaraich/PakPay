// TransferContent.tsx
"use client";
import React from "react";
import { TabsSwitcher } from "./TabSwitcher";
import { RightSidePanel } from "./RightSidePanel";

export function TransferContent({ balance, onrampTx, offrampTx }: any) {
  const [tab, setTab] = React.useState<"deposit" | "withdraw">("deposit");

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 p-4 lg:grid-cols-3">
      <div className="min-w-0 lg:col-span-2">
        <TabsSwitcher tab={tab} setTab={setTab} />
      </div>

      <div className="min-w-0">
        <RightSidePanel
          balance={balance}
          transactions={tab === "deposit" ? onrampTx : offrampTx}
          type={tab}
        />
      </div>
    </div>
  );
}
