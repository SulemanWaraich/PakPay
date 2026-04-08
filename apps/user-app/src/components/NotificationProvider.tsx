"use client";
import { createContext, useContext, useEffect, ReactNode } from "react";
import { io } from "socket.io-client";
import { showToast } from "../app/lib/toastMessage";

interface NotificationContextProps {}

const NotificationContext = createContext<NotificationContextProps>({});

export const NotificationProvider = ({ children, userId, merchantId }: 
  { children: ReactNode, userId?: number, merchantId?: number }) => {

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001", {
      auth: { userId, merchantId }
    });

    // 🔔 Merchant notifications
    if (merchantId) {
      socket.on("merchantPaymentSuccess", (data) => {
        if (Number(data.merchantId) === merchantId)
          showToast("success", `🟢 New payment: $${data.amount}`);
      });

      socket.on("merchantSettlementSuccess", (data) => {
        if (Number(data.merchantId) === merchantId)
          showToast("success", `Settlement processed: $${data.amount}`);
      });
    }

    // 🔔 User notifications
    if (userId) {
      socket.on("onRampSuccess", (data) => {
        if (Number(data.userId) === userId)
          showToast("success", `💰 Deposit successful: $${data.amount}`);
      });

      socket.on("offRampSuccess", (data) => {
        if (Number(data.userId) === userId)
          showToast("success", `💸 Withdrawal successful: $${data.amount}`);
      });
    }

    return () => {
    socket.disconnect(); // ✅ cleanup returns void
  };
  }, [userId, merchantId]);

  return <NotificationContext.Provider value={{}}>{children}</NotificationContext.Provider>;
};

// 🔹 Hook for later use if needed
export const useNotification = () => useContext(NotificationContext);