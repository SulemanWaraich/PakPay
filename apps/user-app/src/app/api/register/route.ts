import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@repo/db";

export async function POST(req: Request) {
  try {
    const { email, number, password } = await req.json();

    if (!email || !number || !password) {
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
