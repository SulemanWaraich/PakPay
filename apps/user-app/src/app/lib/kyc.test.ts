import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isApprovedPaymentQrPayload,
  needsAdminKycReview,
} from "./kyc";

describe("kyc helpers", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://pakpay10.site";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
  });

  it("rejects placeholder and empty payloads", () => {
    expect(isApprovedPaymentQrPayload(null)).toBe(false);
    expect(isApprovedPaymentQrPayload("PAKPAY-1-123")).toBe(false);
  });

  it("accepts payment URLs on the configured public host", () => {
    expect(
      isApprovedPaymentQrPayload(
        "https://pakpay10.site/pay?v=1&type=merchant&mid=42",
      ),
    ).toBe(true);
  });

  it("rejects localhost when public base is production", () => {
    expect(
      isApprovedPaymentQrPayload(
        "http://localhost:3005/pay?v=1&type=merchant&mid=42",
      ),
    ).toBe(false);
    expect(
      needsAdminKycReview(
        "VERIFIED",
        "http://localhost:3005/pay?v=1&type=merchant&mid=42",
      ),
    ).toBe(true);
  });

  it("flags merchants without a valid payment QR", () => {
    expect(needsAdminKycReview("VERIFIED", "PAKPAY-1-123")).toBe(true);
    expect(needsAdminKycReview("SUBMITTED", null)).toBe(true);
    expect(
      needsAdminKycReview(
        "VERIFIED",
        "https://pakpay10.site/pay?v=1&type=merchant&mid=1",
      ),
    ).toBe(false);
  });
});
