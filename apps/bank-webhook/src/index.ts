import express, { json } from "express";
import db from "@repo/db";

const app = express();
app.use(express.json())

app.post("/hdfcWebHook", async (req, res) => {
  console.log( req.body.token,req.body.user_identifier,req.body.amount);
  
  const paymentinformation = {
    token : req.body.token,
    userId: req.body.user_identifier,
    amount: req.body.amount
  };
  // console.log(paymentinformation.token, paymentinformation.amount, paymentinformation.userId);
  
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
  ])
  return res.status(200).json({msg: "captured"});
} catch (error) {
  console.log(error);
  res.status(411).json({msg: "transaction failed"})
}
})


app.post("/withdrawWebHook", async (req, res) => {
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

app.listen(3003);