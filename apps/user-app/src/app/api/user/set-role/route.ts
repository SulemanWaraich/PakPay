import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth"; // adjust path to your authOptions
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

  await prismaPlain.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { role },
    });

    if (role === "MERCHANT") {
      await tx.merchantProfile.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
    }
  });

  return NextResponse.json({ ok: true });
}