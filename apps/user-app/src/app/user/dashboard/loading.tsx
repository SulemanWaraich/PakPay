export default function TransactionsLoading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-8 py-6 shadow-md">

        {/* Spinner */}
        <div className="h-10 w-10 rounded-full border-4 border-muted border-t-green-600 animate-spin" />

        {/* Text */}
        <p className="text-sm font-medium text-muted-foreground">
          Loading your dashboard…
        </p>
      </div>
    </div>
  )
}
