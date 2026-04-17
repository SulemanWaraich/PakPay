import { bankWebhookUrl } from "./bankWebhookUrl";
import {
  signBankWebhookBody,
  WEBHOOK_SIGNATURE_HEADER,
} from "@repo/webhook-signing";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithBackoff(
  url: string,
  init: RequestInit,
  maxAttempts = 4,
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const resp = await fetch(url, init);
      if (resp.ok) return resp;
      const text = await resp.text().catch(() => "");
      lastErr = new Error(`bank-webhook ${resp.status}: ${text}`);
    } catch (e) {
      lastErr = e;
    }
    if (attempt < maxAttempts - 1) {
      const delay = Math.min(5000, 200 * 2 ** attempt) + Math.floor(Math.random() * 100);
      await sleep(delay);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/** Module-level circuit: pause calls after repeated failures (bank-webhook down). */
let circuitOpenUntil = 0;
const CIRCUIT_MS = 30_000;
const FAIL_THRESHOLD = 5;
let consecutiveFailures = 0;

export async function postSignedBankWebhook(
  path: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const secret = process.env.BANK_WEBHOOK_SECRET;
  if (!secret || secret.length < 8) {
    throw new Error("BANK_WEBHOOK_SECRET must be set (min 8 characters)");
  }
  const now = Date.now();
  if (now < circuitOpenUntil) {
    throw new Error("bank-webhook circuit open; try again later");
  }

  const raw = JSON.stringify(body);
  const signature = signBankWebhookBody(secret, raw);
  const url = bankWebhookUrl(path);

  try {
    const resp = await fetchWithBackoff(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [WEBHOOK_SIGNATURE_HEADER]: signature,
      },
      body: raw,
    });
    consecutiveFailures = 0;
    return resp;
  } catch (e) {
    consecutiveFailures += 1;
    if (consecutiveFailures >= FAIL_THRESHOLD) {
      circuitOpenUntil = Date.now() + CIRCUIT_MS;
      consecutiveFailures = 0;
    }
    throw e;
  }
}
