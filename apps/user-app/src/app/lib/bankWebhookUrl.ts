/** Server-side base URL for the bank-webhook service (Docker: http://bank-webhook:3003). */
export function bankWebhookUrl(path: string): string {
  const base = process.env.BANK_WEBHOOK_URL ?? "http://localhost:3003";
  const trimmed = base.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${trimmed}${p}`;
}
