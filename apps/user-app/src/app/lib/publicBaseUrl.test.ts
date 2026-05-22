import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildMerchantPayUrl,
  getPublicBaseUrl,
  qrPayloadNeedsRefresh,
} from "./publicBaseUrl";

describe("publicBaseUrl", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://pakpay10.site";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXTAUTH_URL;
  });

  it("builds merchant pay links from env", () => {
    expect(buildMerchantPayUrl(7)).toBe(
      "https://pakpay10.site/pay?v=1&type=merchant&mid=7",
    );
  });

  it("detects stale localhost payloads", () => {
    expect(
      qrPayloadNeedsRefresh(
        "http://localhost:3005/pay?v=1&type=merchant&mid=7",
      ),
    ).toBe(true);
    expect(
      qrPayloadNeedsRefresh(
        "https://pakpay10.site/pay?v=1&type=merchant&mid=7",
      ),
    ).toBe(false);
  });

  it("falls back to NEXTAUTH_URL when base url unset", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    process.env.NEXTAUTH_URL = "https://pakpay10.site/";
    expect(getPublicBaseUrl()).toBe("https://pakpay10.site");
  });
});
