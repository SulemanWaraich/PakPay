import { describe, expect, it } from "vitest";
import { availableBalancePaisa, totalBalancePaisa } from "./balance";

describe("balance helpers", () => {
  it("available is gross minus locked", () => {
    expect(availableBalancePaisa(10_000, 3_000)).toBe(7_000);
    expect(availableBalancePaisa(500, 800)).toBe(0);
  });

  it("total equals gross amount", () => {
    expect(totalBalancePaisa(10_000, 3_000)).toBe(10_000);
  });
});
