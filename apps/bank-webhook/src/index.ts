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

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "bank-webhook" });
});

app.post("/hdfcWebHook", jsonParser, limiter, requireBankWebhookSignature, async (req, res) => {
  const paymentinformation = {
    token: req.body.token,
    userId: req.body.userId,
    amount: req.body.amount,
  };
  logger.info("onramp webhook", { ...paymentinformation });

  try {
    await db.$transaction(
      [
      db.balance.update({
        where: { userId: paymentinformation.userId },
        data: {
          amount: {
            increment: Number(paymentinformation.amount),
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
    await db.$transaction(
      [
      db.balance.update({
        where: { userId },
        data: {
          amount: { decrement: amount },
        },
      }),
      db.offRampTransaction.update({
        where: { token },
        data: { status: "Success" },
      }),
    ],
      { maxWait: 10_000, timeout: 20_000 },
    );

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
  const paymentinformation = {
    token: req.body.token,
    merchantId: req.body.merchantId,
    amount: req.body.amount,
    customerId: req.body.customerId,
  };

  try {
    await db.$transaction(
      [
      db.balance.update({
        where: { userId: Number(paymentinformation.merchantId) },
        data: {
          amount: {
            increment: paymentinformation.amount,
          },
        },
      }),
      db.balance.update({
        where: { userId: Number(paymentinformation.customerId) },
        data: {
          amount: {
            decrement: paymentinformation.amount,
          },
        },
      }),
    ],
      { maxWait: 10_000, timeout: 20_000 },
    );

    await db.merchantTransaction.update({
      where: { ref: paymentinformation.token },
      data: { status: "SUCCESS" },
    });

    await publishEvent("web-app-channel", {
      type: "merchantPaymentSuccess",
      customerId: paymentinformation.customerId,
      amount: paymentinformation.amount,
      token: paymentinformation.token,
      merchantId: paymentinformation.merchantId,
    });

    return res.status(200).json({ msg: "captured" });
  } catch (error) {
    logger.error("merchantWebHook failed", { error });
    res.status(411).json({ msg: "transaction failed" });
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
