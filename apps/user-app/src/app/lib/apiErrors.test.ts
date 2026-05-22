import { describe, expect, it } from "vitest";
import { apiErrorMessage, zodErrorMessage } from "./apiErrors";
import { registerBodySchema } from "./validation/schemas";

describe("apiErrors", () => {
  it("reads message from API body", () => {
    expect(apiErrorMessage({ message: "Email taken" }, "fallback")).toBe(
      "Email taken",
    );
  });

  it("reads error string from API body", () => {
    expect(apiErrorMessage({ error: "Forbidden" }, "fallback")).toBe("Forbidden");
  });

  it("formats zod register email error", () => {
    const r = registerBodySchema.safeParse({
      email: "bad",
      number: "03001234567",
      password: "password1",
      name: "Test",
      role: "USER",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const msg = zodErrorMessage(r.error.flatten());
      expect(msg).toMatch(/email/i);
    }
  });
});
