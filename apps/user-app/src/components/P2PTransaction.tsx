import { Card } from "@repo/ui"
import { paisaToPkr } from "../app/lib/money"

type P2PTransactionProps = {
  currentUserId: number
  transactions: {
    timestamp: Date
    amount: number
    toUserId: number
    fromUserId: number
    fromUser: { name: string | null; number: string | null }
    toUser: { name: string | null; number: string | null }
  }[]
}

export const P2PTransaction = ({ currentUserId, transactions }: P2PTransactionProps) => {
  if (!transactions.length) {
    return (
      <Card title="Recent Transactions">
        <div className="text-center pb-8 pt-8">No Recent transactions</div>
      </Card>
    )
  }

  return (
    <Card title="Recent Transactions">
      <div className="pt-2 space-y-3">
        {transactions.map((t) => {
          const isReceived = t.toUserId === currentUserId
          const counterparty = isReceived ? t.fromUser : t.toUser
          const label = counterparty.name || counterparty.number
          const prefix = isReceived ? "From" : "To"
          const sign = isReceived ? "+" : "-"

          return (
            <div key={`${t.fromUserId}-${t.toUserId}-${t.timestamp.toISOString()}`} className="flex justify-between">
              <div>
                <div className="text-sm">
                  {prefix}: {label}
                </div>
                <div className="text-slate-600 text-xs">{t.timestamp.toDateString()}</div>
              </div>
              <div className="flex flex-col justify-center text-sm font-medium">
                {sign} Rs {paisaToPkr(t.amount).toLocaleString()}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
