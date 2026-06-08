import { NextResponse } from "next/server";

/** Human-readable labels for validation field keys */
const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  number: "Phone number",
  password: "Password",
  name: "Name",
  role: "Account type",
  amount: "Amount",
  merchantId: "Merchant",
  businessName: "Business name",
  category: "Category",
  address: "Address",
  token: "Reset link",
  message: "Message",
};

export const AUTH_MESSAGES = {
  MISSING_EMAIL: "Enter your email address.",
  MISSING_PASSWORD: "Enter your password.",
  MISSING_FIELDS: "Enter both your email and password.",
  LOCKED:
    "Too many failed login attempts. Wait 15 minutes, then try again.",
  INVALID_CREDENTIALS:
    "Incorrect email or password. Please check both and try again.",
  NOT_LOGGED_IN: "Please sign in to continue.",
  FORBIDDEN: "You do not have permission to perform this action.",
} as const;

export const REGISTER_MESSAGES = {
  DUPLICATE_EMAIL:
    "This email is already registered. Sign in or use a different email.",
  DUPLICATE_PHONE:
    "This phone number is already registered. Sign in or use a different number.",
  RATE_LIMIT:
    "Too many registration attempts. Please wait a few minutes and try again.",
} as const;

/** Read user-facing text from API JSON ({ message } or { error }). */
export function apiErrorMessage(
  data: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!data || typeof data !== "object") return fallback;
  const o = data as Record<string, unknown>;
  if (typeof o.message === "string" && o.message.trim()) return o.message;
  if (typeof o.error === "string" && o.error.trim()) return o.error;
  if (o.error && typeof o.error === "object") {
    return zodErrorMessage(o.error as ZodFlattened);
  }
  return fallback;
}

type ZodFlattened = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};

/** First Zod validation issue as a single sentence. */
export function zodErrorMessage(flattened: ZodFlattened): string {
  for (const [field, errors] of Object.entries(flattened.fieldErrors)) {
    const msg = errors?.[0];
    if (msg) {
      const label = FIELD_LABELS[field] ?? field;
      return msg.toLowerCase().includes(label.toLowerCase())
        ? msg
        : `${label}: ${msg}`;
    }
  }
  if (flattened.formErrors[0]) return flattened.formErrors[0];
  return "Please check your input and try again.";
}

export function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, message, error: message },
    { status },
  );
}

export function jsonOk(message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: true, message, ...extra });
}
