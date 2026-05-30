"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", {
      message: error.message,
      digest: error.digest,
    });
  }, [error.message, error.digest]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Something went wrong. Please try again.
      </p>
      <button
        type="button"
        className="rounded-md bg-green-600 px-4 py-2 text-white text-sm"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
