import React, { Suspense } from "react";

// Import the client component
import PayPageClient from "./PayPageClient";

// Server component can do server-side stuff if needed
export default function PayPage() {
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
