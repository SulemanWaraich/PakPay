import * as nodemailer from "nodemailer";

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER ?? process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS ?? process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.");
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  };
}

function fromAddress(): string {
  return process.env.SMTP_FROM ?? `"PakPay" <${process.env.SMTP_USER ?? process.env.EMAIL_USER}>`;
}

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const transporter = nodemailer.createTransport(smtpConfig());

  await transporter.sendMail({
    from: fromAddress(),
    to: email,
    subject: "Your PakPay verification code",
    html: `
      <p>Your PakPay verification code is:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${otp}</p>
      <p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>
    `,
  });
}

export async function sendResetEmail(email: string, resetLink: string): Promise<void> {
  const transporter = nodemailer.createTransport(smtpConfig());

  await transporter.sendMail({
    from: fromAddress(),
    to: email,
    subject: "Reset your password",
    html: `
      <p>You requested to reset your password.</p>
      <p><a href="${resetLink}">Click here to reset your password</a></p>
      <p>This link will expire in 15 minutes.</p>
    `,
  });
}
