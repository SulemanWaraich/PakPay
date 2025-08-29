"use client"
import { Button } from "@repo/ui";
import { Card } from "@repo/ui";
import { useState } from "react";
import { TextInput } from "@repo/ui";
import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth";
import prisma from "@repo/db";
import { p2pTransfer } from "../app/lib/actions/p2pTransfer";

export const SendMoneyCard = () => {
    const [amount, setAmount] = useState("");
    const [number, setNumber] = useState("");

    return <Card title="Send Money">
    <div className="w-full p-2">
        <TextInput label={"Number"} placeholder={"Number"} onChange={(value) => setNumber(value)} />
        <TextInput label={"Amount"} placeholder={"Amount"} onChange={(value) => setAmount(value)} />
        <div className="flex justify-center pt-4">
            <Button onClick={async () =>{ await p2pTransfer(number, Number(amount) * 100 ) }}>
            Send Money
            </Button>
        </div>
    </div>
</Card>
}