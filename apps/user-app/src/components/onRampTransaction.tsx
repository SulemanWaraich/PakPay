import { Card } from "@repo/ui"
import { useEffect } from "react";

export const OnRampTransactions = ({
    transactions
}: {
    transactions: {
        time: string | null,
        amount: number,
        // TODO: Can the type of `status` be more specific?
        status: string,
        provider: string
    }[]
}) => {
    if (!transactions.length) {
        return <Card title="Recent Transactions">
            <div className="text-center pb-8 pt-8 text-green-600">
                No Recent transactions
            </div>
        </Card>
    }

    return  <Card title="Recent Deposits">
    <div className="pt-2 ">
            {transactions.map((t, i) => 
            <div key={i} className="flex justify-between py-2 border-b last:border-b-0">
                <div>
                    <div className="text-sm">
                        Received PKR
                    </div>
                    <div className="text-slate-600 text-xs">
                        {t.time}
                    </div>
                    <div className="text-xs text-slate-500">{t.provider}</div>
                </div>

                <div className="flex flex-col justify-center text-right">
                    <div className="text-green-600">+ Rs {t.amount / 100}</div>
                    <div className="text-xs text-slate-500">{t.status}</div>
                </div>

            </div>)}
        </div>
    </Card>
}