import { z } from "zod";

const pkPhone = z
  .string({ required_error: "Phone number is required" })
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number must be at most 15 digits")
  .regex(/^\+?[0-9]+$/, "Use digits only (you may start with +)");

export const registerBodySchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Enter a valid email address")
    .max(254, "Email is too long"),
  number: pkPhone,
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  name: z
    .string({ required_error: "Name is required" })
    .min(1, "Enter your full name")
    .max(120, "Name is too long"),
  role: z.enum(["USER", "MERCHANT"], {
    errorMap: () => ({ message: "Choose a valid account type (User or Merchant)" }),
  }),
});

export const amountPkrSchema = z
  .number({ invalid_type_error: "Amount must be a number" })
  .int("Amount must be a whole number (PKR)")
  .positive("Amount must be greater than zero")
  .max(50_000_000, "Amount exceeds the maximum allowed");

export const createOnRampSchema = z.object({
  amount: amountPkrSchema,
  bank: z
    .string({ required_error: "Bank name is required" })
    .min(1, "Select or enter a bank")
    .max(80),
});

export const createOffRampSchema = z.object({
  amount: amountPkrSchema,
  bank: z.string().min(1).max(80).optional(),
  accountHolderName: z
    .string({ required_error: "Account holder name is required" })
    .min(2, "Enter the account holder name")
    .max(120),
  bankName: z
    .string({ required_error: "Bank name is required" })
    .min(2, "Enter the bank name")
    .max(80),
  accountNumber: z
    .string({ required_error: "Account number or IBAN is required" })
    .min(5, "Account number or IBAN is too short")
    .max(34, "Account number or IBAN is too long"),
  branch: z.string().max(120).optional(),
});

export const payBodySchema = z.object({
  merchantId: z.union([
    z.number().int().positive("Invalid merchant"),
    z.string().regex(/^\d+$/, "Invalid merchant ID"),
  ]),
  amount: amountPkrSchema,
  ref: z.string().min(1).max(128).optional(),
  paymentMethod: z
    .enum(["QR", "CARD", "WALLET", "BANK_TRANSFER"], {
      errorMap: () => ({ message: "Choose a valid payment method" }),
    })
    .optional()
    .default("WALLET"),
});

export const contactBodySchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(1, "Enter your name")
    .max(120),
  email: z
    .string({ required_error: "Email is required" })
    .email("Enter a valid email address"),
  message: z
    .string({ required_error: "Message is required" })
    .min(1, "Enter your message")
    .max(5000, "Message is too long"),
});

export const resetPasswordBodySchema = z.object({
  token: z.string({ required_error: "Reset link is invalid or missing" }).min(1),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const forgotPasswordBodySchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Enter a valid email address"),
});
