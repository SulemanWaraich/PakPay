import { describe, expect, it } from "vitest";
import {
  isApprovedPaymentQrPayload,
  needsAdminKycReview,
} from "./kyc";

describe("kyc helpers", () => {
  it("rejects placeholder and empty payloads", () => {
    expect(isApprovedPaymentQrPayload(null)).toBe(false);
    expect(isApprovedPaymentQrPayload("PAKPAY-1-123")).toBe(false);
  });

  it("accepts admin-approved payment URLs", () => {
    expect(
      isApprovedPaymentQrPayload(
        "https://pakpay10.site/pay?v=1&type=merchant&mid=42",
      ),
    ).toBe(true);
  });

  it("flags auto-verified merchants without payment QR", () => {
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
