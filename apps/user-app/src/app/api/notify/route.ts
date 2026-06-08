import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: { name: "PakPay Careers", email: "suleman.devx@gmail.com" },
      to: [{ email: "suleman.devx@gmail.com", name: "Suleman" }],
      subject: "New Career Interest — PakPay",
      htmlContent: `
        <h2>New signup on PakPay Careers</h2>
        <p>Someone just joined the waitlist:</p>
        <p><strong>${email}</strong></p>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}