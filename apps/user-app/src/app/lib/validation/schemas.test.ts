import { describe, expect, it } from "vitest";
import { createOffRampSchema, registerBodySchema } from "./schemas";

describe("validation schemas", () => {
  it("accepts off-ramp payload", () => {
    const r = createOffRampSchema.safeParse({
      amount: 500,
      accountHolderName: "Ali Khan",
      bankName: "HBL",
      accountNumber: "PK12HBL0000001",
      branch: "Karachi",
    });
    expect(r.success).toBe(true);
  });

  it("rejects bad email on register", () => {
    const r = registerBodySchema.safeParse({
      email: "not-an-email",
      number: "03001234567",
      password: "password1",
      name: "Test",
      role: "USER",
    });
    expect(r.success).toBe(false);
  });
});
