import "dotenv/config";
import express from "express";
import db from "@repo/db";
import rateLimit from "express-rate-limit";
import { publishEvent } from "./redis.ts";
import { connectRedis } from "./redis.ts";
import {
  verifyBankWebhookSignature,
  WEBHOOK_SIGNATURE_HEADER,
} from "@repo/webhook-signing";
import { logger } from "./logger.ts";

const app = express();

app.use((req, _res, next) => {
  const rid = req.headers["x-request-id"];
  (req as express.Request & { requestId?: string }).requestId =
    typeof rid === "string" ? rid : Array.isArray(rid) ? rid[0] : undefined;
  next();
});

const jsonParser = express.json({
  verify: (req, _res, buf) => {
    req.rawBody = Buffer.from(buf);
  },
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { msg: "Too many requests, please try again later." },
});

function requireBankWebhookSignature(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const secret = process.env.BANK_WEBHOOK_SECRET;
  const raw = req.rawBody;
  if (!raw?.length) {
    return res.status(400).json({ msg: "missing body" });
  }
  if (!secret || secret.length < 8) {
    if (process.env.NODE_ENV === "production") {
      logger.error("BANK_WEBHOOK_SECRET missing in production");
      return res.status(500).json({ msg: "misconfigured" });
    }
    logger.warn("BANK_WEBHOOK_SECRET unset; skipping signature verification (non-production only)");
    return next();
  }
  const headerVal = req.headers[WEBHOOK_SIGNATURE_HEADER];
  const sig = Array.isArray(headerVal) ? headerVal[0] : headerVal;
  if (!verifyBankWebhookSignature(secret, sig, raw)) {
    return res.status(401).json({ msg: "invalid signature" });
  }
  next();
}

/** Refund customer and mark merchant txn FAILED (idempotent while PENDING). Amounts in paisa. */
async function compensateMerchantWebhookFailure(
  ref: string,
  customerId: number | null,
  amountPaisa: number,
) {
  await db.$transaction(async (tx) => {
    const txn = await tx.merchantTransaction.findUnique({ where: { ref } });
    if (!txn || txn.status !== "PENDING") {
      return;
    }
    if (customerId != null) {
      await tx.balance.update({
        where: { userId: customerId },
        data: { amount: { increment: amountPaisa } },
      });
    }
    await tx.merchantTransaction.update({
      where: { ref },
      data: { status: "FAILED" },
    });
  });
}

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "bank-webhook" });
});

app.post("/hdfcWebHook", jsonParser, limiter, requireBankWebhookSignature, async (req, res) => {
  const paymentinformation = {
    token: req.body.token,
    userId: req.body.userId,
    amount: Number(req.body.amount),
  };
  logger.info("onramp webhook", { ...paymentinformation });

  try {
    await db.$transaction(
      [
        db.balance.update({
          where: { userId: paymentinformation.userId },
          data: {
            amount: {
              increment: paymentinformation.amount,
            },
          },
        }),
        db.onRampTransaction.update({
          where: { token: paymentinformation.token },
          data: { status: "Success" },
        }),
      ],
      { maxWait: 10_000, timeout: 20_000 },
    );

    await publishEvent("web-app-channel", {
      type: "onRampSuccess",
      userId: paymentinformation.userId,
      amount: paymentinformation.amount,
      token: paymentinformation.token,
    });

    return res.status(200).json({ msg: "captured" });
  } catch (error) {
    logger.error("hdfcWebHook failed", { error });
    res.status(500).json({ msg: "transaction failed" });
  }
});

app.post("/withdrawWebHook", jsonParser, limiter, requireBankWebhookSignature, async (req, res) => {
  const token = req.body.token;
  const userId = Number(req.body.user_identifier);
  const amount = Number(req.body.amount);

  if (!token || !userId || !amount) {
    return res.status(400).json({ msg: "missing payload" });
  }

  try {
    const outcome = await db.$transaction(
      async (tx) => {
        const offRamp = await tx.offRampTransaction.findUnique({ where: { token } });
        if (!offRamp || offRamp.userId !== userId) {
          return { kind: "invalid" as const };
        }
        if (offRamp.status !== "Processing") {
          return { kind: "not_processing" as const };
        }

        await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${userId} FOR UPDATE`;

        const balance = await tx.balance.findUnique({ where: { userId } });
        if (!balance) {
          await tx.offRampTransaction.update({
            where: { token },
            data: { status: "Failure" },
          });
          return { kind: "no_balance" as const };
        }

        if (balance.amount < amount) {
          await tx.offRampTransaction.update({
            where: { token },
            data: { status: "Failure" },
          });
          return { kind: "insufficient" as const };
        }

        await tx.balance.update({
          where: { userId },
          data: { amount: { decrement: amount } },
        });
        await tx.offRampTransaction.update({
          where: { token },
          data: { status: "Success" },
        });

        return { kind: "ok" as const };
      },
      { maxWait: 10_000, timeout: 20_000 },
    );

    if (outcome.kind === "invalid") {
      return res.status(400).json({ msg: "invalid withdrawal token" });
    }
    if (outcome.kind === "not_processing") {
      return res.status(400).json({ msg: "withdrawal is not in processing state" });
    }
    if (outcome.kind === "no_balance") {
      return res.status(400).json({ msg: "wallet not found" });
    }
    if (outcome.kind === "insufficient") {
      return res.status(400).json({ msg: "insufficient balance for withdrawal" });
    }

    await publishEvent("web-app-channel", {
      type: "offRampSuccess",
      userId,
      amount,
      token,
    });

    return res.status(200).json({ msg: "withdraw captured" });
  } catch (error) {
    logger.error("withdrawWebHook error", { error });

    try {
      await db.offRampTransaction.update({
        where: { token },
        data: { status: "Failure" },
      });
    } catch {
      // ignore
    }

    return res.status(500).json({ msg: "transaction failed" });
  }
});

app.post("/merchantWebHook", jsonParser, limiter, requireBankWebhookSignature, async (req, res) => {
  const token = String(req.body.token ?? "");
  const merchantUserId = Number(req.body.merchantId);

  if (!token || !merchantUserId) {
    return res.status(400).json({ msg: "missing payload" });
  }

  const txn = await db.merchantTransaction.findUnique({
    where: { ref: token },
  });

  if (!txn) {
    return res.status(404).json({ msg: "unknown transaction" });
  }

  if (txn.status === "SUCCESS") {
    return res.status(200).json({ msg: "already captured" });
  }

  if (txn.status === "FAILED") {
    return res.status(400).json({ msg: "transaction failed" });
  }

  const amountPaisa = txn.amount;
  const customerId = txn.customerId;

  try {
    await db.$transaction(
      [
        db.balance.update({
          where: { userId: merchantUserId },
          data: {
            amount: { increment: amountPaisa },
          },
        }),
        db.merchantTransaction.update({
          where: { ref: token },
          data: { status: "SUCCESS" },
        }),
      ],
      { maxWait: 10_000, timeout: 20_000 },
    );

    await publishEvent("web-app-channel", {
      type: "merchantPaymentSuccess",
      customerId,
      amount: amountPaisa,
      token,
      merchantId: merchantUserId,
    });

    return res.status(200).json({ msg: "captured" });
  } catch (error) {
    logger.error("merchantWebHook failed", { error });

    try {
      await compensateMerchantWebhookFailure(token, customerId, amountPaisa);
    } catch (compError) {
      logger.error("merchantWebHook compensation failed", { compError });
    }

    return res.status(500).json({ msg: "transaction failed" });
  }
});

app.post(
  "/merchantSettlementWebHook",
  jsonParser,
  limiter,
  requireBankWebhookSignature,
  async (req, res) => {
    const settlementId = Number(req.body.settlementId);
    const merchantId = Number(req.body.merchantId);
    const amount = Number(req.body.amount);

    if (!settlementId || !merchantId || !amount) {
      return res.status(400).json({ msg: "missing payload" });
    }

    try {
      await db.$transaction(
        [
          db.balance.update({
            where: { userId: merchantId },
            data: {
              amount: { decrement: amount },
            },
          }),
          db.settlement.update({
            where: { id: settlementId },
            data: {
              status: "SUCCESS",
              processedAt: new Date(),
            },
          }),
        ],
        { maxWait: 10_000, timeout: 20_000 },
      );

      await publishEvent("web-app-channel", {
        type: "merchantSettlementSuccess",
        merchantId,
        amount,
        settlementId,
      });

      return res.status(200).json({ msg: "settlement processed" });
    } catch (error) {
      logger.error("merchantSettlementWebHook error", { error });

      try {
        await db.settlement.update({
          where: { id: settlementId },
          data: { status: "FAILED" },
        });
      } catch {
        // ignore
      }

      return res.status(500).json({ msg: "settlement failed" });
    }
  },
);

async function start() {
  await connectRedis();
  app.listen(3003, "0.0.0.0", () => {
    logger.info("Bank Webhook listening on http://0.0.0.0:3003");
  });
}

start().catch((e) => {
  logger.error("Fatal startup error", { error: String(e) });
  process.exit(1);
});
