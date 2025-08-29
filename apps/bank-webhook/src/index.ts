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

app.listen(3003);