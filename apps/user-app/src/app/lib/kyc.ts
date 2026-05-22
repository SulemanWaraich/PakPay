import { getPublicBaseUrl } from "./publicBaseUrl";

/** Payment QR URLs are set only when an admin approves KYC. */
export function isApprovedPaymentQrPayload(
  qrPayload: string | null | undefined,
): boolean {
  if (!qrPayload || qrPayload.trim() === "") return false;
  if (qrPayload.startsWith("PAKPAY-")) return false;
  if (!qrPayload.includes("/pay?") || !qrPayload.includes("mid=")) return false;

  try {
    const stored = new URL(qrPayload);
    const canonical = new URL(getPublicBaseUrl());
    return stored.host === canonical.host;
  } catch {
    return false;
  }
}

/** Merchant still needs admin review (or QR host/URL is wrong). */
export function needsAdminKycReview(
  kycStatus: string,
  qrPayload: string | null | undefined,
): boolean {
  if (kycStatus === "PENDING" || kycStatus === "SUBMITTED") return true;
  if (kycStatus === "VERIFIED" && !isApprovedPaymentQrPayload(qrPayload)) {
    return true;
  }
  return false;
}
