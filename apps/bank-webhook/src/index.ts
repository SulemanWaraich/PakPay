import express, { json } from "express";
import db from "@repo/db";
import rateLimit from "express-rate-limit"
import { publishEvent } from "./redis.ts";
import { createHmac } from "crypto";

const app = express();
app.use(express.json())
 

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { msg: "Too many requests, please try again later." },
});
app.use(limiter);

// Webhook signature verification function
function verifyWebhookSignature(req: express.Request, res: express.Response, next: express.NextFunction) {
  const signature = req.headers['x-signature'] as string;
  const secret = process.env.WEBHOOK_SECRET;

  if (!signature || !secret) {
    return res.status(401).json({ msg: "Unauthorized: Missing signature or secret" });
  }

  const bodyString = JSON.stringify(req.body);
  const expectedSignature = createHmac('sha256', secret)
    .update(bodyString, 'utf8')
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ msg: "Unauthorized: Invalid signature" });
  }

  next();
}

app.post("/hdfcWebHook", verifyWebhookSignature, async (req, res) => {
  // console.log( req.body.token,req.body.userId ,req.body.amount);
    console.log("Received onramp webhook:", req.body);


  const paymentinformation = {
    token : req.body.token,
    userId: req.body.userId,
    amount: req.body.amount
  };
  // console.log(paymentinformation.token, paymentinformation.amount, paymentinformation.userId);
  console.log("Received onramp webhook:", paymentinformation);

try {
  await db.$transaction([

    db.balance.update({
    where: {
      userId: paymentinformation.userId
    },
    data:{
      amount: {
        increment: Number(paymentinformation.amount)
      }
    }
  }),

   db.onRampTransaction.update({
    where: {
      token: paymentinformation.token
    },
    data: {
      status: "Success"
    }
  })
  ]);

   await publishEvent("web-app-channel", {
      type: "onRampSuccess",
      userId: paymentinformation.userId,
      amount: paymentinformation.amount,
      token: paymentinformation.token,
    });

  return res.status(200).json({msg: "captured"});
} catch (error) {
  console.log(error);
  res.status(411).json({msg: "transaction failed"})
}
})


app.post("/withdrawWebHook", verifyWebhookSignature, async (req, res) => {
  const token = req.body.token;
  const userId = Number(req.body.user_identifier);
  const amount = Number(req.body.amount);

  if (!token || !userId || !amount) {
    return res.status(400).json({ msg: "missing payload" });
  }

  try {
    // Start transaction: update balance and mark offramp txn success
    await db.$transaction([
      // decrement user balance
      db.balance.update({
        where: { userId },
        data: {
          amount: { decrement: amount },
        },
      }),
      // mark the offramp transaction as Success
      db.offRampTransaction.update({
        where: { token },
        data: { status: "Success" },
      }),
    ]);

    await publishEvent("web-app-channel", {
      type: "offRampSuccess",
      userId: userId,
      amount: amount,
      token: token,
    });

    return res.status(200).json({ msg: "withdraw captured" });
  } catch (error) {
    console.error("withdrawWebHook error", error);

    // Handle insufficient funds (Prisma throws) or missing token
    try {
      // set transaction status to Failed if token exists
      await db.offRampTransaction.update({
        where: { token },
        data: { status: "Failure" },
      });
    } catch (e) {
      // ignore
    }

    return res.status(500).json({ msg: "transaction failed" });
  }
});

app.post("/merchantWebHook", verifyWebhookSignature, async (req, res) => {
  // console.log( req.body.token,req.body.userId ,req.body.amount);
  
  const paymentinformation = {
    token: req.body.token,
    merchantId: req.body.merchantId,
    amount: req.body.amount,
    customerId: req.body.customerId
  };
  // console.log(paymentinformation.token, paymentinformation.amount, paymentinformation.merchantId);
  
try {
   await db.$transaction([
      db.balance.update({
      where: { userId: Number(paymentinformation.merchantId) },
      data: {
        amount: {
          increment: paymentinformation.amount
        },
      },
    }),
    db.balance.update({
      where: { userId: Number(paymentinformation.customerId) },
      data: {
        amount: {
          decrement: paymentinformation.amount
        },
      },
    }),
  ]);

    await db.merchantTransaction.update({
    where: {
      ref: paymentinformation.token
    },
    data: {
      status: "SUCCESS",
    },
  });

  await publishEvent("web-app-channel", {
      type: "merchantPaymentSuccess",
      customerId: paymentinformation.customerId,
      amount: paymentinformation.amount,
      token: paymentinformation.token,
      merchantId: paymentinformation.merchantId
    });


  return res.status(200).json({msg: "captured"});
} catch (error) {
  console.log(error);
  res.status(411).json({msg: "transaction failed"})
}
})

app.post("/merchantSettlementWebHook", verifyWebhookSignature, async (req, res) => {
  const settlementId = Number(req.body.settlementId);
  const merchantId = Number(req.body.merchantId);
  const amount = Number(req.body.amount);

  if (!settlementId || !merchantId || !amount) {
    return res.status(400).json({ msg: "missing payload" });
  }

  try {
    await db.$transaction([
      // 1. Deduct balance from merchant wallet
      db.balance.update({
        where: { userId: merchantId },
        data: {
          amount: { decrement: amount },
        },
      }),

      // 2. Mark settlement SUCCESS
      db.settlement.update({
        where: { id: settlementId },
        data: {
          status: "SUCCESS",
          processedAt: new Date(),
        },
      }),
    ]);

    await publishEvent("web-app-channel", {
      type: "merchantSettlementSuccess",
      merchantId: merchantId,
      amount: amount,
      settlementId: settlementId,
    });

    return res.status(200).json({ msg: "settlement processed" });
  } catch (error) {
    console.error("merchantSettlementWebHook error", error);

    try {
      // mark settlement failed if error
      await db.settlement.update({
        where: { id: settlementId },
        data: { status: "FAILED" },
      });
    } catch {}

    return res.status(500).json({ msg: "settlement failed" });
  }
});

app.listen(3003, "0.0.0.0", () => {
  // console.log("Bank Webhook running on http://0.0.0.0:3003");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});