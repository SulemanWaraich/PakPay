import { NextResponse } from "next/server";
import prisma from "@repo/db";
import { nanoid } from "nanoid";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { postSignedBankWebhook } from "../../lib/signedBankWebhook";
import { payBodySchema } from "../../lib/validation/schemas";
import { rateLimitAllow } from "../../lib/rateLimitRedis";
import { getClientIp } from "../../lib/clientIp";
import { AUTH_MESSAGES, jsonError, zodErrorMessage } from "../../lib/apiErrors";
import { pkrToPaisa, withAmountInPkr } from "../../lib/money";
import { compensateFailedMerchantPayment } from "../../lib/merchantPaymentCompensation";
import {
  finalizeCustomerMerchantPayment,
  lockFundsForMerchantPayment,
} from "../../lib/balanceLocks";
import { availableBalancePaisa } from "../../lib/balance";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return jsonError(AUTH_MESSAGES.NOT_LOGGED_IN, 401);
    }

    const uid = String(session.user.id);
    const ip = getClientIp(req);
    if (
      !(await rateLimitAllow(`rl:user:pay:${uid}`, 40, 60)) ||
      !(await rateLimitAllow(`rl:ip:pay:${ip}`, 120, 60))
    ) {
      return jsonError("Too many payment attempts. Wait a minute and try again.", 429);
    }

    const customerId = Number(session.user.id);

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return jsonError("Invalid payment request.", 400);
    }

    const parsed = payBodySchema.safeParse(json);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error.flatten()), 400);
    }

    const { merchantId: midRaw, amount: amountPkr, ref, paymentMethod } = parsed.data;
    const merchantId =
      typeof midRaw === "number" ? midRaw : Number.parseInt(String(midRaw), 10);

    const amountPaisa = pkrToPaisa(amountPkr);

    const merchant = await prisma.merchantProfile.findUnique({
      where: { id: merchantId },
      include: { user: true },
    });

    if (!merchant) {
      return jsonError("This merchant is not available for payments.", 404);
    }

    const paymentRef =
      ref && String(ref).trim().length > 0 ? String(ref).trim() : nanoid(16);

    type TxResult =
      | { kind: "existing_success"; payment: { id: number; amount: number; status: string; ref: string | null } }
      | { kind: "pending_retry"; payment: { id: number; amount: number; status: string; ref: string | null } }
      | { kind: "created"; payment: { id: number; amount: number; status: string; ref: string | null } };

    let txResult: TxResult;

    try {
      txResult = await prisma.$transaction(async (tx) => {
        if (ref) {
          const existing = await tx.merchantTransaction.findUnique({
            where: { ref: paymentRef },
          });

          if (existing) {
            if (existing.status === "SUCCESS") {
              return { kind: "existing_success" as const, payment: existing };
            }
            if (existing.status === "FAILED") {
              throw new Error("REF_FAILED");
            }
            return { kind: "pending_retry" as const, payment: existing };
          }
        }

        await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${customerId} FOR UPDATE`;

        const customerBalance = await tx.balance.findUnique({
          where: { userId: customerId },
        });

        if (!customerBalance) {
          throw new Error("NO_BALANCE");
        }

        if (availableBalancePaisa(customerBalance.amount, customerBalance.locked) < amountPaisa) {
          throw new Error("INSUFFICIENT");
        }

        const payment = await tx.merchantTransaction.create({
          data: {
            merchantId,
            amount: amountPaisa,
            customerId,
            paymentMethod,
            ref: paymentRef,
            status: "PENDING",
          },
        });

        await lockFundsForMerchantPayment(tx, customerId, amountPaisa);

        return { kind: "created" as const, payment };
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "INSUFFICIENT") {
        return jsonError(
          "Insufficient wallet balance. Add money to your wallet or use bank transfer.",
          400,
        );
      }
      if (msg === "NO_BALANCE") {
        return jsonError("Your wallet was not found. Contact support.", 404);
      }
      if (msg === "REF_FAILED") {
        return jsonError("This payment reference has already failed. Start a new payment.", 400);
      }
      throw e;
    }

    if (txResult.kind === "existing_success") {
      return NextResponse.json({
        success: true,
        message: "Payment already processed",
        payment: withAmountInPkr(txResult.payment),
      });
    }

    try {
      await postSignedBankWebhook("merchantWebHook", {
        amount: amountPaisa,
        merchantId: merchant.userId,
        customerId,
        token: paymentRef,
      });
    } catch (webhookError) {
      console.error("merchantWebHook call failed:", webhookError);
      await compensateFailedMerchantPayment(paymentRef, customerId, amountPaisa);

      const failed = await prisma.merchantTransaction.findUnique({
        where: { ref: paymentRef },
      });

      return jsonError(
        failed?.status === "FAILED"
          ? "Payment could not be completed. Your wallet has been refunded."
          : "Payment could not be processed. Please try again.",
        502,
      );
    }

    const payment = await prisma.merchantTransaction.findUnique({
      where: { ref: paymentRef },
    });

    if (!payment || payment.status !== "SUCCESS") {
      await compensateFailedMerchantPayment(paymentRef, customerId, amountPaisa);
      return jsonError("Payment could not be completed. Your wallet has been refunded.", 502);
    }

    await finalizeCustomerMerchantPayment(customerId, amountPaisa, paymentRef);

    return NextResponse.json({
      success: true,
      payment: withAmountInPkr(payment),
      message: "Payment successful",
    });
  } catch (error: unknown) {
    console.error("Payment error:", error);
    return jsonError("Payment could not be processed. Please try again.", 500);
  }
}
