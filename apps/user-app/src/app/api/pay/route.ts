import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';


export async function POST(req: Request) {
  const { merchantId, amount, ref } = await req.json();

  if (!merchantId || !amount) {
    return NextResponse.json({ error: "Invalid payment" }, { status: 400 });
  }

  // later: balance check, transactions, etc.
  console.log("Payment:", { merchantId, amount, ref });

  return NextResponse.json({ success: true });
}
