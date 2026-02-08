export const dynamic = "force-dynamic";
import React, { Suspense } from "react";

// Import the client component
import PayPageClient from "./PayPageClient";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../lib/auth";
import prisma from "@repo/db";

type PayPageProps = {
  searchParams: {
    mid?: string;
  };
};

// Server component can do server-side stuff if needed
export default async function PayPage({ searchParams }: PayPageProps) {
  const session = await getServerSession(authOptions);
  const merchantId = Number(searchParams.mid);

  if (!merchantId) {
    throw new Error("Invalid QR code. Merchant ID is missing.");
  }

  // Fetch merchant to get owner (userId)
  const merchantProfile = await prisma.merchantProfile.findUnique({
    where: { id: merchantId },
    select: { userId: true },
  });

  if (!merchantProfile) {
    throw new Error("Merchant not found.");
  }

  // Must check login AFTER loading merchant
  const userId = Number(session?.user?.id);

  if (!session?.user?.id) {
    redirect(`/auth/signin?reason=payment_auth&merchantId=${merchantId}`);
  }

  // 🔥 FINAL SELF-PAYMENT CHECK (correct)
  if (userId === merchantProfile.userId) {
    return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Error</h1>
      <p className="text-lg text-red-700 text-center">
        You cannot pay yourself.
      </p>
    </div>
  );
  }
     
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <p>Loading payment page…</p>
          </div>
        }
      >
        <PayPageClient/>
      </Suspense>
    </div>
  );
}
