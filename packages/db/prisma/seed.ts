import {
  PrismaClient,
  OnRampStatus,
  OffRampStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // --- Suleman ---
  const suleman = await prisma.user.upsert({
    where: { number: "9999999999" },
    update: {},
    create: {
      number: "9999999999",
      password: "suleman123",
      name: "Suleman",
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

  // --- Usama ---
  const usama = await prisma.user.upsert({
    where: { number: "9999999998" },
    update: {},
    create: {
      number: "9999999998",
      password: "usama123",
      name: "Usama",
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

  // --- p2p Transfers between Suleman and Usama ---
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
  });

  console.log({
    message: "✅ Database seeded successfully!",
    suleman,
    usama,
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
