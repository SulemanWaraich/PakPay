import { z } from "zod";

const pkPhone = z
  .string()
  .min(10)
  .max(15)
  .regex(/^\+?[0-9]+$/, "Invalid phone format");

export const registerBodySchema = z.object({
  email: z.string().email().max(254),
  number: pkPhone,
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
  role: z.enum(["USER", "MERCHANT"]),
});

export const amountPkrSchema = z
  .number()
  .int()
  .positive()
  .max(50_000_000);

export const createOnRampSchema = z.object({
  amount: amountPkrSchema,
  bank: z.string().min(1).max(80),
});

export const createOffRampSchema = z.object({
  amount: amountPkrSchema,
  bank: z.string().min(1).max(80).optional(),
  accountHolderName: z.string().min(2).max(120),
  bankName: z.string().min(2).max(80),
  accountNumber: z.string().min(5).max(34),
  branch: z.string().max(120).optional(),
});

export const payBodySchema = z.object({
  merchantId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  amount: amountPkrSchema,
  ref: z.string().min(1).max(128).optional(),
  paymentMethod: z
    .enum(["QR", "CARD", "WALLET", "BANK_TRANSFER"])
    .optional()
    .default("WALLET"),
});

export const contactBodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
});
