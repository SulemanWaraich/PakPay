import {
  PrismaClient,
  OnRampStatus,
  OffRampStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { SEED_CREDENTIALS } from "./seed.credentials.local.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const { admin, suleman: sulemanCreds, usama: usamaCreds } = SEED_CREDENTIALS;

  const adminPassword = await bcrypt.hash(admin.password, 10);
  await prisma.user.upsert({
    where: { number: admin.number },
    update: {
      email: admin.email,
      password: adminPassword,
      role: "ADMIN",
      name: admin.name,
    },
    create: {
      email: admin.email,
      password: adminPassword,
      role: "ADMIN",
      number: admin.number,
      name: admin.name,
    },
  });

  const sulemanPassword = await bcrypt.hash(sulemanCreds.password, 10);
  const suleman = await prisma.user.upsert({
    where: { number: sulemanCreds.number },
    update: {
      email: sulemanCreds.email,
      password: sulemanPassword,
      name: sulemanCreds.name,
    },
    create: {
      email: sulemanCreds.email,
      number: sulemanCreds.number,
      password: sulemanPassword,
      name: sulemanCreds.name,
      OnRampTransaction: {
        create: [
          {
            startTime: new Date(),
            status: OnRampStatus.Success,
            amount: 15000,
            token: "ONRAMP001",
            provider: "Meezan Bank",
          },
          {
            startTime: new Date(),
            status: OnRampStatus.Processing,
            amount: 5000,
            token: "ONRAMP002",
            provider: "HBL Bank",
          },
        ],
      },
      Balance: {
        create: {
          amount: 18000,
          locked: 2000,
        },
      },
      OffRampTransaction: {
        create: [
          {
            startTime: new Date(),
            status: OffRampStatus.Success,
            amount: 3000,
            token: "OFFRAMP001",
            bankAccount: "PK45HBL0000123456",
          },
          {
            startTime: new Date(),
            status: OffRampStatus.Failure,
            amount: 1000,
            token: "OFFRAMP002",
            bankAccount: "PK90MEZN0000654321",
          },
        ],
      },
    },
  });

  const usamaPassword = await bcrypt.hash(usamaCreds.password, 10);
  const usama = await prisma.user.upsert({
    where: { number: usamaCreds.number },
    update: {
      email: usamaCreds.email,
      password: usamaPassword,
      name: usamaCreds.name,
    },
    create: {
      email: usamaCreds.email,
      number: usamaCreds.number,
      password: usamaPassword,
      name: usamaCreds.name,
      OnRampTransaction: {
        create: [
          {
            startTime: new Date(),
            status: OnRampStatus.Failure,
            amount: 4000,
            token: "ONRAMP003",
            provider: "Allied Bank",
          },
          {
            startTime: new Date(),
            status: OnRampStatus.Success,
            amount: 12000,
            token: "ONRAMP004",
            provider: "UBL Bank",
          },
        ],
      },
      Balance: {
        create: {
          amount: 15000,
          locked: 0,
        },
      },
      OffRampTransaction: {
        create: [
          {
            startTime: new Date(),
            status: OffRampStatus.Success,
            amount: 2000,
            token: "OFFRAMP003",
            bankAccount: "PK09ALLD0000987654",
          },
        ],
      },
    },
  });

  await prisma.p2pTransfer.createMany({
    data: [
      {
        amount: 1000,
        timestamp: new Date(),
        fromUserId: suleman.id,
        toUserId: usama.id,
      },
      {
        amount: 2500,
        timestamp: new Date(),
        fromUserId: usama.id,
        toUserId: suleman.id,
      },
      {
        amount: 500,
        timestamp: new Date(),
        fromUserId: suleman.id,
        toUserId: usama.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log({
    message: "✅ Database seeded successfully!",
    logins: {
      admin: { email: admin.email, number: admin.number },
      suleman: { email: sulemanCreds.email, number: sulemanCreds.number },
      usama: { email: usamaCreds.email, number: usamaCreds.number },
    },
    sulemanId: suleman.id,
    usamaId: usama.id,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
