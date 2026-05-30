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

/** Release customer lock and mark merchant txn FAILED (idempotent while PENDING). Amounts in paisa. */
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
      await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${customerId} FOR UPDATE`;
      const balance = await tx.balance.findUnique({ where: { userId: customerId } });
      if (balance) {
        const release = Math.min(balance.locked, amountPaisa);
        if (release > 0) {
          await tx.balance.update({
            where: { userId: customerId },
            data: { locked: { decrement: release } },
          });
        }
      }
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
  const token = String(req.body.token ?? "");
  const userId = Number(req.body.userId);
  const amount = Number(req.body.amount);

  if (!token || !userId || !amount) {
    return res.status(400).json({ msg: "missing payload" });
  }

  logger.info("onramp webhook", { token, userId, amount });

  try {
    const outcome = await db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "OnRampTransaction" WHERE token = ${token} FOR UPDATE`;

        const onRamp = await tx.onRampTransaction.findUnique({ where: { token } });
        if (!onRamp) {
          return { kind: "invalid" as const };
        }
        if (onRamp.userId !== userId) {
          return { kind: "invalid" as const };
        }

        if (onRamp.status === "Success") {
          return { kind: "already_success" as const, creditAmount: onRamp.amount };
        }
        if (onRamp.status === "Failure") {
          return { kind: "already_failed" as const };
        }
        if (onRamp.status !== "Processing") {
          return { kind: "invalid" as const };
        }

        const creditAmount = onRamp.amount;

        await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${userId} FOR UPDATE`;

        await tx.balance.update({
          where: { userId },
          data: { amount: { increment: creditAmount } },
        });
        await tx.onRampTransaction.update({
          where: { token },
          data: { status: "Success" },
        });

        return { kind: "processed" as const, creditAmount };
      },
      { maxWait: 10_000, timeout: 20_000 },
    );

    if (outcome.kind === "invalid") {
      return res.status(400).json({ msg: "invalid on-ramp token" });
    }
    if (outcome.kind === "already_failed") {
      return res.status(400).json({ msg: "transaction already failed" });
    }
    if (outcome.kind === "already_success") {
      return res.status(200).json({ msg: "already processed" });
    }

    await publishEvent("web-app-channel", {
      type: "onRampSuccess",
      userId,
      amount: outcome.creditAmount,
      token,
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
        await tx.$queryRaw`SELECT id FROM "OffRampTransaction" WHERE token = ${token} FOR UPDATE`;

        const offRamp = await tx.offRampTransaction.findUnique({ where: { token } });
        if (!offRamp || offRamp.userId !== userId) {
          return { kind: "invalid" as const };
        }

        const withdrawAmount = offRamp.amount;

        if (offRamp.status === "Success") {
          return { kind: "already_success" as const, withdrawAmount };
        }
        if (offRamp.status === "Failure") {
          return { kind: "already_failed" as const };
        }
        if (offRamp.status !== "Processing") {
          return { kind: "invalid" as const };
        }

        await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${userId} FOR UPDATE`;

        const balance = await tx.balance.findUnique({ where: { userId } });

        const releaseLockAndFail = async () => {
          if (balance) {
            const release = Math.min(balance.locked, withdrawAmount);
            if (release > 0) {
              await tx.balance.update({
                where: { userId },
                data: { locked: { decrement: release } },
              });
            }
          }
          await tx.offRampTransaction.update({
            where: { token },
            data: { status: "Failure" },
          });
        };

        if (!balance) {
          await releaseLockAndFail();
          return { kind: "no_balance" as const };
        }

        if (balance.locked < withdrawAmount) {
          await releaseLockAndFail();
          return { kind: "insufficient" as const };
        }

        await tx.balance.update({
          where: { userId },
          data: {
            amount: { decrement: withdrawAmount },
            locked: { decrement: withdrawAmount },
          },
        });
        await tx.offRampTransaction.update({
          where: { token },
          data: { status: "Success" },
        });

        return { kind: "ok" as const, withdrawAmount };
      },
      { maxWait: 10_000, timeout: 20_000 },
    );

    if (outcome.kind === "invalid") {
      return res.status(400).json({ msg: "invalid withdrawal token" });
    }
    if (outcome.kind === "already_failed") {
      return res.status(400).json({ msg: "transaction already failed" });
    }
    if (outcome.kind === "already_success") {
      return res.status(200).json({ msg: "already processed" });
    }
    if (outcome.kind === "no_balance") {
      return res.status(400).json({ msg: "wallet not found" });
    }
    if (outcome.kind === "insufficient") {
      return res.status(400).json({ msg: "insufficient balance for withdrawal" });
    }

    if (outcome.kind !== "ok") {
      return res.status(500).json({ msg: "transaction failed" });
    }

    await publishEvent("web-app-channel", {
      type: "offRampSuccess",
      userId,
      amount: outcome.withdrawAmount,
      token,
    });

    return res.status(200).json({ msg: "withdraw captured" });
  } catch (error) {
    logger.error("withdrawWebHook error", { error });

    try {
      await db.$transaction(async (tx) => {
        const offRamp = await tx.offRampTransaction.findUnique({ where: { token } });
        if (!offRamp || offRamp.status !== "Processing") {
          return;
        }
        const balance = await tx.balance.findUnique({ where: { userId } });
        if (balance) {
          const release = Math.min(balance.locked, offRamp.amount);
          if (release > 0) {
            await tx.balance.update({
              where: { userId },
              data: { locked: { decrement: release } },
            });
          }
        }
        await tx.offRampTransaction.update({
          where: { token },
          data: { status: "Failure" },
        });
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

  try {
    const outcome = await db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "MerchantTransaction" WHERE ref = ${token} FOR UPDATE`;

        const txn = await tx.merchantTransaction.findUnique({ where: { ref: token } });
        if (!txn) {
          return { kind: "not_found" as const };
        }

        if (txn.status === "SUCCESS") {
          return {
            kind: "already_success" as const,
            amountPaisa: txn.amount,
            customerId: txn.customerId,
          };
        }
        if (txn.status === "FAILED") {
          return { kind: "already_failed" as const };
        }

        const amountPaisa = txn.amount;
        const customerId = txn.customerId;

        await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${merchantUserId} FOR UPDATE`;

        await tx.balance.update({
          where: { userId: merchantUserId },
          data: { amount: { increment: amountPaisa } },
        });
        await tx.merchantTransaction.update({
          where: { ref: token },
          data: { status: "SUCCESS" },
        });

        return { kind: "processed" as const, amountPaisa, customerId };
      },
      { maxWait: 10_000, timeout: 20_000 },
    );

    if (outcome.kind === "not_found") {
      return res.status(404).json({ msg: "unknown transaction" });
    }
    if (outcome.kind === "already_failed") {
      return res.status(400).json({ msg: "transaction failed" });
    }
    if (outcome.kind === "already_success" || outcome.kind === "processed") {
      await publishEvent("web-app-channel", {
        type: "merchantPaymentSuccess",
        customerId: outcome.customerId,
        amount: outcome.amountPaisa,
        token,
        merchantId: merchantUserId,
      });
      return res.status(200).json({
        msg: outcome.kind === "already_success" ? "already captured" : "captured",
      });
    }

    return res.status(500).json({ msg: "transaction failed" });
  } catch (error) {
    logger.error("merchantWebHook failed", { error });

    try {
      const txn = await db.merchantTransaction.findUnique({ where: { ref: token } });
      await compensateMerchantWebhookFailure(
        token,
        txn?.customerId ?? null,
        txn?.amount ?? 0,
      );
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
      const outcome = await db.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM "Settlement" WHERE id = ${settlementId} FOR UPDATE`;

          const settlement = await tx.settlement.findUnique({
            where: { id: settlementId },
          });

          if (!settlement) {
            return { kind: "invalid" as const };
          }

          const profile = await tx.merchantProfile.findUnique({
            where: { id: settlement.merchantId },
            select: { userId: true },
          });
          if (!profile || profile.userId !== merchantId) {
            return { kind: "invalid" as const };
          }

          if (settlement.status === "SUCCESS") {
            return { kind: "already_success" as const, amount: settlement.amount };
          }
          if (settlement.status === "FAILED") {
            return { kind: "already_failed" as const };
          }
          if (settlement.status !== "PROCESSING") {
            return { kind: "invalid" as const };
          }

          const debitAmount = settlement.amount;

          await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${merchantId} FOR UPDATE`;

          await tx.balance.update({
            where: { userId: merchantId },
            data: { amount: { decrement: debitAmount } },
          });
          await tx.settlement.update({
            where: { id: settlementId },
            data: {
              status: "SUCCESS",
              processedAt: new Date(),
            },
          });

          return { kind: "processed" as const, amount: debitAmount };
        },
        { maxWait: 10_000, timeout: 20_000 },
      );

      if (outcome.kind === "invalid") {
        return res.status(400).json({ msg: "invalid settlement" });
      }
      if (outcome.kind === "already_failed") {
        return res.status(400).json({ msg: "settlement already failed" });
      }

      if (outcome.kind === "processed") {
        await publishEvent("web-app-channel", {
          type: "merchantSettlementSuccess",
          merchantId,
          amount: outcome.amount,
          settlementId,
        });
      }

      return res.status(200).json({
        msg: outcome.kind === "already_success" ? "already processed" : "settlement processed",
      });
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
