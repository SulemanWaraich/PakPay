"use client";

import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { showToast } from "../app/lib/toastMessage";
import { PUBLIC_SOCKET_URL } from "../app/lib/publicEnv";
import { paisaToPkr } from "../app/lib/money";
import { useSocketToken } from "../app/hooks/useSocketToken";

/**
 * @param merchantUserId — Merchant's User.id (matches Redis `merchant-{id}` rooms).
 * @param merchantProfileId — Optional MerchantProfile.id for server-side ownership check.
 */
export default function MerchantNotificationListener({
  merchantUserId,
  merchantProfileId,
}: {
  merchantUserId: number;
  merchantProfileId?: number;
}) {
  const socketToken = useSocketToken();

  useEffect(() => {
    if (!socketToken) {
      return;
    }

    let socket: Socket | undefined;

    const auth: { token: string; merchantId?: number } = { token: socketToken };
    if (merchantProfileId != null) {
      auth.merchantId = merchantProfileId;
    }

    socket = io(PUBLIC_SOCKET_URL, {
      auth,
    });

    socket.on("connect_error", () => {
      // Invalid or expired session
    });

    socket.on("settlementEvent", (data) => {
      if (
        data.type === "merchantSettlementSuccess" &&
        Number(data.merchantId) === merchantUserId
      ) {
        showToast(
          "success",
          `Your settlement of PKR ${paisaToPkr(Number(data.amount)).toFixed(2)} has been processed!`,
        );
      }
    });

    socket.on("paymentEvent", (data) => {
      if (Number(data.merchantId) === merchantUserId) {
        showToast(
          "success",
          `New payment received: PKR ${paisaToPkr(Number(data.amount)).toFixed(2)}`,
        );
      }
    });

    return () => {
      socket?.disconnect();
    };
  }, [merchantUserId, merchantProfileId, socketToken]);

  return null;
}
