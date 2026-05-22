/**
 * Public site URL for payment links and QR codes (server-side).
 * Prefer NEXT_PUBLIC_BASE_URL; fall back to NEXTAUTH_URL.
 */
export function getPublicBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "";

  if (!raw) {
    throw new Error(
      "NEXT_PUBLIC_BASE_URL is not set. Set it to your public site URL (e.g. https://pakpay10.site).",
    );
  }

  return raw.replace(/\/$/, "");
}

/** Payment URL encoded in merchant QR codes. */
export function buildMerchantPayUrl(merchantId: number): string {
  return `${getPublicBaseUrl()}/pay?v=1&type=merchant&mid=${merchantId}`;
}

/** True when stored QR URL does not match the configured public base URL. */
export function qrPayloadNeedsRefresh(
  qrPayload: string | null | undefined,
): boolean {
  if (!qrPayload?.trim()) return true;
  try {
    const stored = new URL(qrPayload);
    const canonical = new URL(getPublicBaseUrl());
    return stored.host !== canonical.host;
  } catch {
    return true;
  }
}
