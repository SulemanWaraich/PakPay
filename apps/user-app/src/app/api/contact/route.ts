import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { contactBodySchema } from "../../lib/validation/schemas";
import { rateLimitAllow } from "../../lib/rateLimitRedis";
import { getClientIp } from "../../lib/clientIp";
import { logger } from "../../lib/logger";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!(await rateLimitAllow(`rl:ip:contact:${ip}`, 8, 60 * 10))) {
    return NextResponse.json(
      { success: false, message: "Too many messages. Try again later." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = contactBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
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

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("contact mail failed", { error: String(error) });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
