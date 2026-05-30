"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { showToast } from "../app/lib/toastMessage";
import { PUBLIC_SOCKET_URL } from "../app/lib/publicEnv";
import { paisaToPkr } from "../app/lib/money";

export default function MerchantNotificationListener({ merchantId }: { merchantId: number }) {
  useEffect(() => {
    const socket = io(PUBLIC_SOCKET_URL, {
      auth: { merchantId }
    });

    socket.on("settlementEvent", (data) => {
      if (data.type === "merchantSettlementSuccess" && Number(data.merchantId) === merchantId) {
        showToast("success", `Your settlement of PKR ${paisaToPkr(Number(data.amount)).toFixed(2)} has been processed!`);
      }
    });

    socket.on("paymentEvent", (data) => {
      if (Number(data.merchantId) === merchantId) {
        showToast(
          "success",
          `New payment received: PKR ${paisaToPkr(Number(data.amount)).toFixed(2)}`,
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [merchantId]);

  return null; // Invisible component
}
