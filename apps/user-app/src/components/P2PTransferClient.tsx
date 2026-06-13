"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { SendMoneyCard } from "./SendMoneyCard";
import { P2PTransaction } from "./P2PTransaction";
import { PUBLIC_SOCKET_URL } from "../app/lib/publicEnv";
import { useSocketToken } from "../app/hooks/useSocketToken";

type Transaction = {
  timestamp: Date;
  amount: number;
  toUserId: number;
  fromUserId: number;
  fromUser: { name: string | null; number: string | null };
  toUser: { name: string | null; number: string | null };
};

type Props = {
  userId: number;
  initialTransactions: Transaction[];
};

export default function P2PTransferClient({ userId, initialTransactions }: Props) {
  const router = useRouter();
  const socketToken = useSocketToken();
  const [transactions, setTransactions] = useState(initialTransactions);

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  useEffect(() => {
    if (!socketToken) return;

    let socket: Socket | undefined;

    socket = io(PUBLIC_SOCKET_URL, {
      auth: { token: socketToken },
    });

    socket.on("p2pTransferAdded", (data) => {
      const fromUserId = Number(data.fromUserId);
      const toUserId = Number(data.toUserId);
      if (fromUserId !== userId && toUserId !== userId) return;

      setTransactions((prev) => {
        const next: Transaction = {
          fromUserId,
          toUserId,
          amount: Number(data.amount),
          timestamp: new Date(data.timestamp ?? Date.now()),
          fromUser: data.fromUser ?? { name: null, number: null },
          toUser: data.toUser ?? { name: null, number: null },
        };
        const key = `${next.fromUserId}-${next.toUserId}-${next.timestamp.toISOString()}`;
        const exists = prev.some(
          (t) =>
            `${t.fromUserId}-${t.toUserId}-${t.timestamp.toISOString()}` === key,
        );
        if (exists) return prev;
        return [next, ...prev].slice(0, 10);
      });

      setTimeout(() => router.refresh(), 500);
    });

    return () => {
      socket?.disconnect();
    };
  }, [userId, socketToken, router]);

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="min-w-0 lg:col-span-2">
        <SendMoneyCard />
      </div>
      <div className="min-w-0">
        <P2PTransaction currentUserId={userId} transactions={transactions} />
      </div>
    </div>
  );
}
