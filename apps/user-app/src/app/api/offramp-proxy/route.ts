import { NextResponse } from "next/server";
import { bankWebhookUrl } from "../../lib/bankWebhookUrl";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const resp = await fetch(bankWebhookUrl("withdrawWebHook"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  const text = await resp.text();
    console.log("Webhook response:", resp.status, text);

    if (!resp.ok) {
      return NextResponse.json({ success: false, error: "Webhook failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Proxy webhook error:", error);
    return NextResponse.json({ success: false, error: "Failed to call webhook" }, { status: 500 });
  }
}
