import React, { Suspense } from "react";

// Import the client component
import PayPageClient from "./PayPageClient";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../lib/auth";

// Server component can do server-side stuff if needed
export default async function PayPage() {
  const session = await getServerSession(authOptions); 
     if (!session?.user?.id ) {
       redirect("/auth/signin?reason=payment_auth")
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
        <PayPageClient />
      </Suspense>
    </div>
  );
}
