"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { showToast } from "../app/lib/toastMessage";
import { PUBLIC_SOCKET_URL } from "../app/lib/publicEnv";

export default function MerchantNotificationListener({ merchantId }: { merchantId: number }) {
  useEffect(() => {
    const socket = io(PUBLIC_SOCKET_URL, {
      auth: { merchantId }
    });

    socket.on("settlementEvent", (data) => {
      console.log("🔥 LIVE event:", data);

      // We only show notification for settlement events
      if (data.type === "merchantSettlementSuccess" && Number(data.merchantId) === merchantId) {
        showToast("success", `Your settlement of $${data.amount} has been processed!`);
      }
    });

    socket.on("paymentEvent", (data) => {
          console.log("🔥 FRONTEND RECEIVED paymentEvent:", data);
    if (Number(data.merchantId) === merchantId) {
        showToast("success", `🟢 New payment received: $${data.amount}`);
    }
    });

    socket.on("bankWebhookEvent", (data) => {
          console.log("🔥 FRONTEND RECEIVED bankWebhookEvent:", data);
         showToast(`🟢 New payment received: $${data.amount}`, {duration: 2000});
    });

    return () => {
      socket.disconnect();
    };
  }, [merchantId]);

  return null; // Invisible component
}
