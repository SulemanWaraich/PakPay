// app/api/create-offramp/route.ts
import { NextResponse } from "next/server";
import prisma from "@repo/db"; // your prisma client
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import {LRUCache} from "lru-cache";

const rateLimit = new LRUCache({
  max: 100, // store up to 100 IPs
  ttl: 60 * 1000, // 1 minute window
});



export async function POST(req: Request) {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
        const current: any = rateLimit.get(ip) || 0;
    
        if (current >= 20) {
          return NextResponse.json(
             { success: false, error: "Too many requests. Try again later." },
                { status: 429 }
                );
            }
        rateLimit.set(ip, current + 1);
    

    try {
        const { amount, bank } = await req.json();

        // Input validation
        if (!amount || typeof amount !== 'number' || amount <= 0 || amount > 100000) {
            return NextResponse.json(
                { success: false, error: "Invalid amount. Must be a positive number up to 100,000." },
                { status: 400 }
            );
        }
        if (!bank || typeof bank !== 'string' || bank.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: "Invalid bank provider." },
                { status: 400 }
            );
        }

        const session = await getServerSession(authOptions);
       if (!session || !session.user) {
  return NextResponse.json(
    { success: false, error: "User not logged in" },
    { status: 401 }
  );
}

        // Additional rate limiting per user
        const userKey = `user-${session.user.id}`;
        const userCurrent: any = rateLimit.get(userKey) || 0;
        if (userCurrent >= 10) { // stricter limit per user
            return NextResponse.json(
                { success: false, error: "Too many requests from this user. Try again later." },
                { status: 429 }
            );
        }
        rateLimit.set(userKey, userCurrent + 1);


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

        // await fetch("/api/onramp-proxy", {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({amount,
        //      token,
        //      userId: Number(session?.user?.id) }),
        //     });

        return NextResponse.json({ success: true, transaction });


        
    } catch (error) {
        console.error("create-onramp error:", error);
        return NextResponse.json({ success: false, error: "Failed to create onramp" }, { status: 500 });
    }
}
