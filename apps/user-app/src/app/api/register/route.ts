import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@repo/db";
import { handleApiError } from "../../lib/middlewares/errorHandler";
import { rateLimitAllow } from "../../lib/rateLimitRedis";
import { getClientIp } from "../../lib/clientIp";
import { registerBodySchema } from "../../lib/validation/schemas";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ok = await rateLimitAllow(`rl:ip:register:${ip}`, 5, 10 * 60);
  if (!ok) {
    return NextResponse.json(
      { success: false, message: "Too many registration attempts. Try again later." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request" },
      { status: 400 },
    );
  }

  const parsed = registerBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, number, password, name, role } = parsed.data;

  try {
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email }, { number }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User with this email or number already exists.",
        },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name,
        email,
        number,
        password: hashedPassword,
        role,
      },
    });

    await db.balance.create({
      data: {
        userId: user.id,
        amount: 0,
        locked: 0,
      },
    });

    if (role === "MERCHANT") {
      await db.merchantProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    return NextResponse.json(
      { success: true, message: "User registered successfully" },
      { status: 201 },
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
