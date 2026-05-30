import { describe, expect, it } from "vitest";
import { mapAmountsToPkr, paisaToPkr, pkrToPaisa, withAmountInPkr } from "./money";

describe("money", () => {
  it("converts PKR to paisa and back", () => {
    expect(pkrToPaisa(150)).toBe(15000);
    expect(paisaToPkr(15000)).toBe(150);
  });

  it("maps API records to PKR at the boundary", () => {
    expect(withAmountInPkr({ id: 1, amount: 50000 }).amount).toBe(500);
    expect(mapAmountsToPkr([{ amount: 100 }, { amount: 250 }]).map((r) => r.amount)).toEqual([
      1, 2.5,
    ]);
  });
});
