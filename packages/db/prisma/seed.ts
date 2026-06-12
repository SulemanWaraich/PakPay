import {
  DisputeStatus,
  KycStatus,
  MerchantCategory,
  OffRampStatus,
  OnRampStatus,
  PaymentMethod,
  SettlementStatus,
  TransactionStatus,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { prismaPlain as prisma } from "../src/index.js";

const DEMO_PASSWORD = "Demo@1234";

const DEMO_EMAILS = [
  "demo.user@pakpay.site",
  "demo.merchant@pakpay.site",
  "demo.merchant2@pakpay.site",
  "demo.admin@pakpay.site",
  "demo.user2@pakpay.site",
  "admin@pakpay.site",   // 👈 add this
] as const;

/** PKR → paisa */
const pkr = (amountPkr: number) => Math.round(amountPkr * 100);

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000);

async function cleanupDemoData() {
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: [...DEMO_EMAILS] } },
    select: { id: true },
  });
  const demoUserIds = existingUsers.map((u) => u.id);

  const existingProfiles =
    demoUserIds.length > 0
      ? await prisma.merchantProfile.findMany({
          where: { userId: { in: demoUserIds } },
          select: { id: true },
        })
      : [];
  const demoProfileIds = existingProfiles.map((p) => p.id);

  if (demoProfileIds.length > 0) {
    await prisma.auditLog.deleteMany({
      where: { merchantId: { in: demoProfileIds } },
    });
  }

  if (demoUserIds.length > 0) {
    await prisma.dispute.deleteMany({
      where: { userId: { in: demoUserIds } },
    });
  }

  if (demoUserIds.length > 0 || demoProfileIds.length > 0) {
    const or: { customerId?: { in: number[] }; merchantId?: { in: number[] } }[] =
      [];
    if (demoUserIds.length > 0) {
      or.push({ customerId: { in: demoUserIds } });
    }
    if (demoProfileIds.length > 0) {
      or.push({ merchantId: { in: demoProfileIds } });
    }
    await prisma.merchantTransaction.deleteMany({ where: { OR: or } });
  }

  if (demoProfileIds.length > 0) {
    await prisma.settlement.deleteMany({
      where: { merchantId: { in: demoProfileIds } },
    });
  }

  if (demoUserIds.length > 0) {
    await prisma.p2pTransfer.deleteMany({
      where: {
        OR: [
          { fromUserId: { in: demoUserIds } },
          { toUserId: { in: demoUserIds } },
        ],
      },
    });
    await prisma.onRampTransaction.deleteMany({
      where: { userId: { in: demoUserIds } },
    });
    await prisma.offRampTransaction.deleteMany({
      where: { userId: { in: demoUserIds } },
    });
    await prisma.balance.deleteMany({
      where: { userId: { in: demoUserIds } },
    });
    await prisma.merchantProfile.deleteMany({
      where: { userId: { in: demoUserIds } },
    });
  }

  await prisma.user.deleteMany({
    where: { email: { in: [...DEMO_EMAILS] } },
  });
}

async function main() {
  console.log("🌱 Seeding PakPay demo data…");

  await cleanupDemoData();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const passwordHashAdmin = await bcrypt.hash("Pedri&Gavi@321", 10);

  const sara = await prisma.user.create({
    data: {
      email: "demo.user@pakpay.site",
      password: passwordHash,
      name: "Sara Malik",
      number: "+923001234567",
      role: UserRole.USER,
      Balance: { create: { amount: pkr(45_000), locked: 0 } },
    },
  });

  const ahmed = await prisma.user.create({
    data: {
      email: "demo.merchant@pakpay.site",
      password: passwordHash,
      name: "Ahmed Khan",
      number: "+923007654321",
      role: UserRole.MERCHANT,
      Balance: { create: { amount: pkr(28_000), locked: 0 } },
    },
  });

  const bilal = await prisma.user.create({
    data: {
      email: "demo.merchant2@pakpay.site",
      password: passwordHash,
      name: "Bilal Raza",
      number: "+923331122334",
      role: UserRole.MERCHANT,
      Balance: { create: { amount: pkr(9_500), locked: 0 } },
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@pakpay.site",
      password: passwordHashAdmin,
      name: "Admin User",
      number: "+923009999999",
      role: UserRole.ADMIN,
      Balance: { create: { amount: 0, locked: 0 } },
    },
  });

  const usman = await prisma.user.create({
    data: {
      email: "demo.user2@pakpay.site",
      password: passwordHash,
      name: "Usman Tariq",
      number: "+923451234567",
      role: UserRole.USER,
      Balance: { create: { amount: pkr(15_000), locked: 0 } },
    },
  });

  const karachiBites = await prisma.merchantProfile.create({
    data: {
      userId: ahmed.id,
      businessName: "Karachi Bites",
      category: MerchantCategory.FOOD,
      address: "Block 5, Clifton, Karachi",
      kycStatus: KycStatus.VERIFIED,
      ownerName: "Ahmed Khan",
      createdAt: daysAgo(35),
    },
  });

  await prisma.merchantProfile.update({
    where: { id: karachiBites.id },
    data: {
      qrPayload: `https://pakpay.site/pay?v=1&type=merchant&mid=${karachiBites.id}`,
    },
  });

  await prisma.merchantProfile.create({
    data: {
      userId: bilal.id,
      businessName: "TechZone Accessories",
      category: MerchantCategory.TECH,
      address: "Main Boulevard, Gulberg III, Lahore",
      kycStatus: KycStatus.SUBMITTED,
      ownerName: "Bilal Raza",
      kycSubmittedAt: daysAgo(3),
      createdAt: daysAgo(14),
    },
  });

  const onRampSpecs = [
    { amount: 10_000, provider: "HBL", days: 30, token: "DEMO-ONRAMP-001" },
    { amount: 15_000, provider: "Meezan Bank", days: 22, token: "DEMO-ONRAMP-002" },
    { amount: 8_000, provider: "HBL", days: 15, token: "DEMO-ONRAMP-003" },
    { amount: 20_000, provider: "UBL", days: 7, token: "DEMO-ONRAMP-004" },
    { amount: 5_000, provider: "Meezan Bank", days: 2, token: "DEMO-ONRAMP-005" },
  ] as const;

  for (const spec of onRampSpecs) {
    await prisma.onRampTransaction.create({
      data: {
        userId: sara.id,
        amount: pkr(spec.amount),
        provider: spec.provider,
        status: OnRampStatus.Success,
        token: spec.token,
        startTime: daysAgo(spec.days),
      },
    });
  }

  await prisma.offRampTransaction.create({
    data: {
      userId: sara.id,
      amount: pkr(5_000),
      status: OffRampStatus.Success,
      token: "DEMO-OFFRAMP-001",
      startTime: daysAgo(20),
      accountHolderName: "Sara Malik",
      bankName: "HBL",
      accountNumber: "01234567890123",
      bankAccount: "HBL — 01234567890123",
    },
  });

  await prisma.offRampTransaction.create({
    data: {
      userId: sara.id,
      amount: pkr(3_000),
      status: OffRampStatus.Success,
      token: "DEMO-OFFRAMP-002",
      startTime: daysAgo(10),
      accountHolderName: "Sara Malik",
      bankName: "Meezan Bank",
      accountNumber: "98765432109876",
      bankAccount: "Meezan Bank — 98765432109876",
    },
  });

  await prisma.p2pTransfer.create({
    data: {
      fromUserId: sara.id,
      toUserId: usman.id,
      amount: pkr(2_000),
      timestamp: daysAgo(18),
    },
  });

  await prisma.p2pTransfer.create({
    data: {
      fromUserId: sara.id,
      toUserId: usman.id,
      amount: pkr(500),
      timestamp: daysAgo(5),
    },
  });

  await prisma.p2pTransfer.create({
    data: {
      fromUserId: usman.id,
      toUserId: sara.id,
      amount: pkr(1_000),
      timestamp: daysAgo(12),
    },
  });

  await prisma.p2pTransfer.create({
    data: {
      fromUserId: usman.id,
      toUserId: sara.id,
      amount: pkr(2_500),
      timestamp: daysAgo(26),
    },
  });
  
  await prisma.p2pTransfer.create({
    data: {
      fromUserId: sara.id,
      toUserId: usman.id,
      amount: pkr(1_800),
      timestamp: daysAgo(14),
    },
  });
  
  await prisma.p2pTransfer.create({
    data: {
      fromUserId: usman.id,
      toUserId: sara.id,
      amount: pkr(3_000),
      timestamp: daysAgo(9),
    },
  });
  
  await prisma.p2pTransfer.create({
    data: {
      fromUserId: sara.id,
      toUserId: usman.id,
      amount: pkr(700),
      timestamp: daysAgo(3),
    },
  });

  const settlement1 = await prisma.settlement.create({
    data: {
      merchantId: karachiBites.id,
      amount: pkr(850 + 1_200 + 650 + 2_100),
      status: SettlementStatus.SUCCESS,
      scheduledFor: daysAgo(26),
      processedAt: daysAgo(26),
      createdAt: daysAgo(27),
    },
  });

  const settlement2 = await prisma.settlement.create({
    data: {
      merchantId: karachiBites.id,
      amount: pkr(450 + 1_800 + 950),
      status: SettlementStatus.SUCCESS,
      scheduledFor: daysAgo(6),
      processedAt: daysAgo(6),
      createdAt: daysAgo(7),
    },
  });

  const merchantTxSpecs = [
    {
      ref: "KB-001",
      amount: 850,
      days: 28,
      customerId: sara.id,
      settlementId: settlement1.id,
      settled: true,
      refunded: false,
      status: TransactionStatus.SUCCESS,
    },
    {
      ref: "KB-002",
      amount: 1_200,
      days: 24,
      customerId: sara.id,
      settlementId: settlement1.id,
      settled: true,
      refunded: false,
      status: TransactionStatus.SUCCESS,
    },
    {
      ref: "KB-003",
      amount: 650,
      days: 20,
      customerId: sara.id,
      settlementId: settlement1.id,
      settled: true,
      refunded: true,
      status: TransactionStatus.FAILED,
      refundedAt: daysAgo(18),
    },
    {
      ref: "KB-004",
      amount: 2_100,
      days: 16,
      customerId: sara.id,
      settlementId: settlement1.id,
      settled: true,
      refunded: false,
      status: TransactionStatus.SUCCESS,
    },
    {
      ref: "KB-005",
      amount: 450,
      days: 12,
      customerId: sara.id,
      settlementId: settlement2.id,
      settled: true,
      refunded: false,
      status: TransactionStatus.SUCCESS,
    },
    {
      ref: "KB-006",
      amount: 1_800,
      days: 8,
      customerId: sara.id,
      settlementId: settlement2.id,
      settled: true,
      refunded: false,
      status: TransactionStatus.SUCCESS,
    },
    {
      ref: "KB-007",
      amount: 950,
      days: 4,
      customerId: sara.id,
      settlementId: settlement2.id,
      settled: true,
      refunded: false,
      status: TransactionStatus.SUCCESS,
    },
    {
      ref: "KB-008",
      amount: 750,
      days: 1,
      customerId: sara.id,
      settlementId: null,
      settled: false,
      refunded: false,
      status: TransactionStatus.SUCCESS,
    },
    // Usman transactions
    {
      ref: "KB-009",
      amount: 3_200,
      days: 26,
      customerId: usman.id,
      settlementId: settlement1.id,
      settled: true,
      refunded: false,
      status: TransactionStatus.SUCCESS,
    },
    {
      ref: "KB-010",
      amount: 1_500,
      days: 19,
      customerId: usman.id,
      settlementId: settlement2.id,
      settled: true,
      refunded: false,
      status: TransactionStatus.SUCCESS,
    },
    {
      ref: "KB-011",
      amount: 2_800,
      days: 11,
      customerId: usman.id,
      settlementId: settlement2.id,
      settled: true,
      refunded: false,
      status: TransactionStatus.SUCCESS,
    },
    {
      ref: "KB-012",
      amount: 900,
      days: 3,
      customerId: usman.id,
      settlementId: null,
      settled: false,
      refunded: false,
      status: TransactionStatus.SUCCESS,
    },
  ] as const;

  const merchantTxByRef: Record<string, { id: number }> = {};

  for (const spec of merchantTxSpecs) {
    const createdAt = daysAgo(spec.days);
    const txn = await prisma.merchantTransaction.create({
      data: {
        merchantId: karachiBites.id,
        customerId: spec.customerId,          // 👈 changed from sara.id
        amount: pkr(spec.amount),
        paymentMethod: PaymentMethod.QR,
        status: spec.status,
        settled: spec.settled,
        settledAt: spec.settled ? daysAgo(Math.max(spec.days - 2, 1)) : null,
        settlementId: spec.settlementId,
        refunded: spec.refunded,
        refundedAt: "refundedAt" in spec ? spec.refundedAt : null,
        ref: spec.ref,
        createdAt,
      },
    });
    merchantTxByRef[spec.ref] = { id: txn.id };
  }

  await prisma.dispute.create({
    data: {
      transactionId: merchantTxByRef["KB-003"].id,
      userId: sara.id,
      reason:
        "I was charged but did not receive my order. The merchant confirmed cancellation verbally.",
      status: DisputeStatus.RESOLVED,
      adminNotes: "Verified with merchant. Refund processed.",
      createdAt: daysAgo(19),
      resolvedAt: daysAgo(18),
    },
  });

  await prisma.dispute.create({
    data: {
      transactionId: merchantTxByRef["KB-006"].id,
      userId: sara.id,
      reason:
        "Duplicate charge — I was charged twice for the same order. Please check transaction ref KB-006.",
      status: DisputeStatus.PENDING,
      createdAt: daysAgo(7),
    },
  });

  await prisma.auditLog.create({
    data: {
      merchantId: karachiBites.id,
      action: "DISPUTE_REFUND",
      performedBy: admin.id,
      reason: "Verified with merchant. Refund processed.",
      createdAt: daysAgo(18),
    },
  });

  await prisma.auditLog.create({
    data: {
      merchantId: karachiBites.id,
      action: "KYC_APPROVE",
      performedBy: admin.id,
      reason: "Karachi Bites KYC approved for demo",
      createdAt: daysAgo(29),
    },
  });

  console.log("Demo seed complete:");
  console.log("User:      demo.user@pakpay.site / Demo@1234");
  console.log("Merchant:  demo.merchant@pakpay.site / Demo@1234");
  console.log("Merchant2: demo.merchant2@pakpay.site / Demo@1234");
  console.log("Admin:     demo.admin@pakpay.site / Demo@1234");
  console.log("User2:     demo.user2@pakpay.site / Demo@1234");
}

try {
  await main();
} catch (e) {
  console.error("❌ Demo seed failed:", e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
