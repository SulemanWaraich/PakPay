import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { contactBodySchema } from "../../lib/validation/schemas";
import { rateLimitAllow } from "../../lib/rateLimitRedis";
import { getClientIp } from "../../lib/clientIp";
import { logger } from "../../lib/logger";
import { jsonError, zodErrorMessage } from "../../lib/apiErrors";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!(await rateLimitAllow(`rl:ip:contact:${ip}`, 8, 60 * 10))) {
    return jsonError("Too many messages sent. Please try again in a few minutes.", 429);
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonError("Invalid request. Please fill the form and try again.", 400);
  }

  const parsed = contactBodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(zodErrorMessage(parsed.error.flatten()), 400);
  }

  const { name, email, message } = parsed.data;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"PakPay Support" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "New Contact Form Message",
      html: `
        <h3>New Support Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Your message was sent. We will reply by email soon.",
    });
  } catch (error) {
    logger.error("contact mail failed", { error: String(error) });
    return jsonError(
      "We could not send your message right now. Try again later.",
      500,
    );
  }
}
