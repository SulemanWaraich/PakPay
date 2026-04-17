import { describe, expect, it } from "vitest";
import {
  signBankWebhookBody,
  verifyBankWebhookSignature,
} from "./index";

describe("webhook HMAC", () => {
  it("accepts valid signature for exact body bytes", () => {
    const secret = "x".repeat(32);
    const body = JSON.stringify({ amount: 100, token: "abc" });
    const sig = signBankWebhookBody(secret, body);
    expect(verifyBankWebhookSignature(secret, sig, Buffer.from(body, "utf8"))).toBe(
      true,
    );
  });

  it("rejects tampered body", () => {
    const secret = "x".repeat(32);
    const body = JSON.stringify({ a: 1 });
    const sig = signBankWebhookBody(secret, body);
    expect(
      verifyBankWebhookSignature(
        secret,
        sig,
        Buffer.from(JSON.stringify({ a: 2 }), "utf8"),
      ),
    ).toBe(false);
  });
});
