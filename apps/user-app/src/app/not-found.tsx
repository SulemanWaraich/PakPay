import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground text-sm">The page you requested does not exist.</p>
      <Link href="/" className="text-green-600 underline text-sm">
        Go home
      </Link>
    </div>
  );
}
