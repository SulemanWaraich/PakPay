import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prismaPlain } from "@repo/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = await req.json();

  if (role !== "USER" && role !== "MERCHANT") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const userId = Number(session.user.id);

  await prismaPlain.user.update({
    where: { id: userId },
    data: { role },
  });

  await prismaPlain.balance.upsert({
    where: { userId },
    create: { userId, amount: 0, locked: 0 },
    update: {},
  });

  if (role === "MERCHANT") {
    await prismaPlain.merchantProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  return NextResponse.json({ ok: true });
}