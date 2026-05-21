/**
 * Copy to seed.credentials.local.ts (gitignored) and set your local dev passwords.
 *
 *   cp prisma/seed.credentials.example.ts prisma/seed.credentials.local.ts
 */
export const SEED_CREDENTIALS = {
  admin: {
    email: "admin@example.com",
    password: "change-me-admin",
    number: "03000000000",
    name: "Admin",
  },
  suleman: {
    email: "suleman@pakpay.com",
    password: "suleman123",
    number: "9999999999",
    name: "Suleman",
  },
  usama: {
    email: "usama@pakpay.com",
    password: "usama123",
    number: "9999999998",
    name: "Usama",
  },
} as const;
