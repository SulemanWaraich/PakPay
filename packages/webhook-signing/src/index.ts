import crypto from "node:crypto";

/** Header name for HMAC-SHA256 over the exact request body bytes (UTF-8 JSON string from sender). */
export const WEBHOOK_SIGNATURE_HEADER = "x-pakpay-signature";

/**
 * Produces `sha256=<hex>` for the given UTF-8 body string.
 * The same string must be sent as the HTTP body (e.g. JSON.stringify(payload)).
 */
export function signBankWebhookBody(secret: string, bodyUtf8: string): string {
  const mac = crypto.createHmac("sha256", secret).update(bodyUtf8, "utf8").digest("hex");
  return `sha256=${mac}`;
}

/**
 * Verifies `X-PakPay-Signature: sha256=<hex>` against the raw body buffer (before JSON parse).
 */
export function verifyBankWebhookSignature(
  secret: string | undefined,
  signatureHeader: string | undefined,
  bodyBuffer: Buffer,
): boolean {
  if (!secret || secret.length < 8) return false;
  if (!signatureHeader || typeof signatureHeader !== "string") return false;
  const trimmed = signatureHeader.trim();
  if (!trimmed.startsWith("sha256=")) return false;
  const receivedHex = trimmed.slice("sha256=".length);
  if (!/^[0-9a-f]+$/i.test(receivedHex)) return false;
  const bodyUtf8 = bodyBuffer.toString("utf8");
  const expectedMac = crypto.createHmac("sha256", secret).update(bodyUtf8, "utf8").digest("hex");
  if (receivedHex.length !== expectedMac.length) return false;
  try {
    const left = new Uint8Array(Buffer.from(receivedHex, "hex"));
    const right = new Uint8Array(Buffer.from(expectedMac, "hex"));
    return crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}
