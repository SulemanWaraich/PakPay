"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { showToast } from "../app/lib/toastMessage";

export default function UserNotificationListener({ userId }: { userId: number }) {
  useEffect(() => {
    const socket = io("http://localhost:5001", {
      auth: { userId }
    });

    // 🔔 On-Ramp deposit success
    socket.on("onRampSuccess", (data) => {
      if (Number(data.userId) === userId) {
        showToast("success", `💰 Deposit successful: $${data.amount}`);
      }
    });

    // 🔔 Off-Ramp withdrawal success
    socket.on("offRampSuccess", (data) => {
      if (Number(data.userId) === userId) {
        showToast("success", `💸 Withdrawal successful: $${data.amount}`);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  return null; // Invisible component
}