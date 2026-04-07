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
        const session = await getServerSession(authOptions);
       if (!session || !session.user) {
  return NextResponse.json(
    { success: false, error: "User not logged in" },
    { status: 401 }
  );
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
