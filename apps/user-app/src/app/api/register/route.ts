import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@repo/db";
import { LRUCache } from "lru-cache";

const rateLimit = new LRUCache({
  max: 100,              // Track up to 100 IPs
  ttl: 10 * 60 * 1000,   // 10-minute window
});



export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const current: any = rateLimit.get(ip) || 0;

  if (current >= 5) {
    return NextResponse.json(
      { message: "Too many registration attempts. Try again later." },
      { status: 429 }
    );
  }

  rateLimit.set(ip, current + 1);

  try {
    const { email, number, password, name } = await req.json();

    if (!email || !number || !password || !name){
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name,
        email,
        number,
        password: hashedPassword,
      },
    });

    await db.balance.create({
    data: {
      userId: user.id,
      amount: 0,
      locked: 0,
    },
  });

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json(
      { message: "Something went wrong", error: err.message },
      { status: 500 }
    );
  }
}
