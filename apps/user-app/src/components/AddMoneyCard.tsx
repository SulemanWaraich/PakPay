"use client"
import { Button } from "@repo/ui";
import { Card } from "@repo/ui";
import { Center } from "@repo/ui";
import { Select } from "@repo/ui";
import { useState } from "react";
import { TextInput } from "@repo/ui";
import {  CreateOnRampTransaction } from "../app/lib/actions/CreateOnRamptxn";







const SUPPORTED_BANKS = [
    {
        name: "HBL (Habib Bank Limited)",
        redirectUrl: "https://www.hblibank.com.pk"
    },
    {
        name: "Meezan Bank",
        redirectUrl: "https://ebanking.meezanbank.com"
    },
    {
        name: "UBL (United Bank Limited)",
        redirectUrl: "https://www.ubldigital.com"
    },
    {
        name: "MCB Bank",
        redirectUrl: "https://www.mcb.com.pk"
    },
    {
        name: "Allied Bank Limited",
        redirectUrl: "https://www.abl.com"
    }
];

export const AddMoney = () => {
    const [redirectUrl, setRedirectUrl] = useState(SUPPORTED_BANKS[0]?.redirectUrl);
    const [amount, setAmount] = useState(0);
    const [provider, setProvider] = useState(SUPPORTED_BANKS[0]?.name);

    return <Card title="Add Money">
    <div className="w-full p-2">
        <TextInput label={"Amount"} placeholder={"Amount"} onChange={(value) => {
            setAmount(Number(value))
        }} />
        <div className="py-4 text-left">
            Bank
        </div>
        <Select onSelect={(value) => {
            setRedirectUrl(SUPPORTED_BANKS.find(x => x.name === value)?.redirectUrl || "")
            setProvider(SUPPORTED_BANKS.find(x => x.name === value)?.name || "")
        }} options={SUPPORTED_BANKS.map(x => ({
            key: x.name,
            value: x.name
        }))} />
        <div className="flex justify-center pt-4">
            <Button onClick={() => {
                window.location.href = redirectUrl || "";
                CreateOnRampTransaction(amount, provider)
            }}>
            Add Money
            </Button>
        </div>
    </div>
</Card>
}