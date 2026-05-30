"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { showToast } from "../app/lib/toastMessage";
import { PUBLIC_SOCKET_URL } from "../app/lib/publicEnv";
import { paisaToPkr } from "../app/lib/money";

export default function UserNotificationListener({ userId }: { userId: number }) {
  useEffect(() => {
    const socket = io(PUBLIC_SOCKET_URL, {
      auth: { userId }
    });

    // 🔔 On-Ramp deposit success
    socket.on("onRampSuccess", (data) => {
      if (Number(data.userId) === userId) {
        showToast("success", `💰 Deposit successful: PKR ${paisaToPkr(Number(data.amount)).toFixed(2)}`);
      }
    });

    // 🔔 Off-Ramp withdrawal success
    socket.on("offRampSuccess", (data) => {
      if (Number(data.userId) === userId) {
        showToast("success", `💸 Withdrawal successful: PKR ${paisaToPkr(Number(data.amount)).toFixed(2)}`);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  return null; // Invisible component
}