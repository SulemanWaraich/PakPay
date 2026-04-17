"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {error.message || "An unexpected error occurred. Please try again."}
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
