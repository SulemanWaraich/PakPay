// components/TopCustomers.tsx

import { formatDistanceToNow } from "date-fns"
import { Card, CardContent } from "./ui/card"

interface Customer {
  id: string
  name: string
  total: number
  count: number
  lastSeen: Date
}

export default function TopCustomers({ customers }: { customers: Customer[] }) {
  if (!customers.length) return null

  const maxTotal = customers[0].total // already sorted desc by total

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800">Top Customers</h2>
            <p className="text-xs text-gray-400 mt-0.5">Your highest-value repeat buyers</p>
          </div>
          <span className="text-xs bg-green-50 text-green-700 font-medium px-2 py-1 rounded-full">
            by lifetime spend
          </span>
        </div>

        <div className="space-y-4">
          {customers.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3">

              {/* Rank badge */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${i === 0 ? "bg-yellow-100 text-yellow-700" :
                    i === 1 ? "bg-gray-200 text-gray-600"     :
                    i === 2 ? "bg-orange-100 text-orange-600" :
                              "bg-green-50 text-green-600"}`}
              >
                {i + 1}
              </div>

              {/* Avatar initial */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                <p className="text-xs text-gray-400">
                  {c.count} order{c.count !== 1 ? "s" : ""}
                  {" · "}
                  avg PKR {Math.round(c.total / c.count).toLocaleString()}
                  {" · last "}
                  {formatDistanceToNow(new Date(c.lastSeen), { addSuffix: true })}
                </p>
              </div>

              {/* Spend amount + bar */}
              <div className="flex flex-col items-end gap-1 w-36 shrink-0">
                <span className="text-sm font-semibold text-green-700">
                  PKR {c.total.toLocaleString()}
                </span>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(c.total / maxTotal) * 100}%` }}
                  />
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Footer hint */}
        <p className="text-xs text-gray-300 mt-4 text-center">
          Showing top {customers.length} customers · all time
        </p>
      </CardContent>
    </Card>
  )
}
