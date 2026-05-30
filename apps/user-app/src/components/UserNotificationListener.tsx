"use client";

import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { showToast } from "../app/lib/toastMessage";
import { PUBLIC_SOCKET_URL } from "../app/lib/publicEnv";
import { paisaToPkr } from "../app/lib/money";
import { useSocketToken } from "../app/hooks/useSocketToken";

export default function UserNotificationListener({ userId }: { userId: number }) {
  const socketToken = useSocketToken();

  useEffect(() => {
    if (!socketToken) {
      return;
    }

    let socket: Socket | undefined;

    socket = io(PUBLIC_SOCKET_URL, {
      auth: { token: socketToken },
    });

    socket.on("connect_error", () => {
      // Invalid or expired session — ignore silently
    });

    socket.on("onRampSuccess", (data) => {
      if (Number(data.userId) === userId) {
        showToast(
          "success",
          `Deposit successful: PKR ${paisaToPkr(Number(data.amount)).toFixed(2)}`,
        );
      }
    });

    socket.on("offRampSuccess", (data) => {
      if (Number(data.userId) === userId) {
        showToast(
          "success",
          `Withdrawal successful: PKR ${paisaToPkr(Number(data.amount)).toFixed(2)}`,
        );
      }
    });

    return () => {
      socket?.disconnect();
    };
  }, [userId, socketToken]);

  return null;
}
