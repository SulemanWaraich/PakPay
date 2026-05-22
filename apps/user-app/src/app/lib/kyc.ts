/** Payment QR URLs are set only when an admin approves KYC. */
export function isApprovedPaymentQrPayload(
  qrPayload: string | null | undefined,
): boolean {
  if (!qrPayload || qrPayload.trim() === "") return false;
  if (qrPayload.startsWith("PAKPAY-")) return false;
  return qrPayload.includes("/pay?") && qrPayload.includes("mid=");
}

/** Merchant still needs admin review (or QR was never issued after a bad auto-verify). */
export function needsAdminKycReview(
  kycStatus: string,
  qrPayload: string | null | undefined,
): boolean {
  if (kycStatus === "PENDING" || kycStatus === "SUBMITTED") return true;
  if (kycStatus === "VERIFIED" && !isApprovedPaymentQrPayload(qrPayload)) return true;
  return false;
}
