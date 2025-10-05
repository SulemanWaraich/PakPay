// app/api/create-offramp/route.ts
import { NextResponse } from "next/server";
import prisma from "@repo/db"; // your prisma client
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

export async function POST(req: Request) {
    try {
        const { amount, bank } = await req.json();
        const session = await getServerSession(authOptions);
        if (!session.user) {
          return NextResponse.json({ success: false, error: "User not logged in" }, { status: 401 });
        }


        const token = String(Math.random() * 100);

        // create a withdrawal record in DB
        const transaction = await prisma.onRampTransaction.create({
            data: {
                amount,
                provider: bank,
                status: "Processing",
                startTime: new Date(),
                token,
                userId: Number(session?.user?.id)
            },
        });

        return NextResponse.json({ success: true, transaction });


        
    } catch (error) {
        console.error("create-onramp error:", error);
        return NextResponse.json({ success: false, error: "Failed to create onramp" }, { status: 500 });
    }
}
