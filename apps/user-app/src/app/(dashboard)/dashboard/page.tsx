// app/dashboard/page.tsx
import { Card, CardContent } from "../../../components/ui/card"
import prisma from "@repo/db"
import ActivityChart from "../../../components/ChartClient"

export default async function DashboardPage() {
  const onRamps = await prisma.onRampTransaction.findMany({
    where: { status: "Success" },
    orderBy: { startTime: "asc" },
  })
  const offRamps = await prisma.offRampTransaction.findMany({
    where: { status: "Success" },
    orderBy: { startTime: "asc" },
  })
  const transfers = await prisma.p2pTransfer.findMany({
    orderBy: { timestamp: "asc" },
  })

  const dailyData: Record<string, { onRamp: number; offRamp: number; p2p: number }> = {}
  onRamps.forEach((txn) => {
    const date = txn.startTime.toISOString().split("T")[0]
    if (!dailyData[date]) dailyData[date] = { onRamp: 0, offRamp: 0, p2p: 0 }
    dailyData[date].onRamp += txn.amount
  })
  offRamps.forEach((txn) => {
    const date = txn.startTime.toISOString().split("T")[0]
    if (!dailyData[date]) dailyData[date] = { onRamp: 0, offRamp: 0, p2p: 0 }
    dailyData[date].offRamp += txn.amount
  })
  transfers.forEach((txn) => {
    const date = txn.timestamp.toISOString().split("T")[0]
    if (!dailyData[date]) dailyData[date] = { onRamp: 0, offRamp: 0, p2p: 0 }
    dailyData[date].p2p += txn.amount
  })

   const allTransactions = [
    ...onRamps.map((t) => ({ time: t.startTime, amount: t.amount })),
    ...offRamps.map((t) => ({ time: t.startTime, amount: t.amount })),
    ...transfers.map((t) => ({ time: t.timestamp, amount: t.amount })),
  ]

   // 🗓️ Calculate monthly transactions count
  const now = new Date()
  const monthlyTransactions = allTransactions.filter((t) => {
    const d = new Date(t.time)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  // 💸 Calculate weekly spending
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(now.getDate() - 7)
  const weeklySpending = allTransactions
    .filter((t) => new Date(t.time) >= oneWeekAgo)
    .reduce((sum, t) => sum + t.amount, 0)
  

  const chartData = Object.entries(dailyData)
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const balance = await prisma.balance.findFirst({ where: { userId: 1 } })

  return (
    <div className="flex w-screen min-h-screen bg-gradient-to-br from-green-50/30 via-white to-emerald-50/20">
      <main className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Greeting */}
          <div className="mb-6 sm:text-left text-center">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
              <h1 className="sm:text-4xl text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Good afternoon, Suleman
              </h1>
            </div>
            <p className="text-gray-600 text-sm ml-4">Welcome back to your financial dashboard</p>
          </div>

          {/* Top Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="lg:col-span-1 bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-lg text-white">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-green-100 mb-1">Portfolio Value</p>
                <p className="sm:text-3xl text-xl font-bold mb-1">${balance?.amount ?? 0}</p>
                <span className="text-xs text-green-100">Total Balance</span>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 🔹 Dynamic Monthly Transactions */}
              <Card className="bg-white/80 border border-green-100/50 shadow-md">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">{monthlyTransactions}</p>
                      <p className="text-xs text-gray-600">This Month</p>
                    </div>
                  </div>
                  <h3 className="font-medium text-sm text-gray-800">Total Transactions</h3>
                  <p className="text-xs text-green-600">Auto-calculated from DB</p>
                </CardContent>
              </Card>

              {/* 🔹 Dynamic Weekly Spending */}
              <Card className="bg-white/80 border border-green-100/50 shadow-md">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">${weeklySpending.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">This Week</p>
                    </div>
                  </div>
                  <h3 className="font-medium text-sm text-gray-800">Weekly Spending</h3>
                  <p className="text-xs text-blue-600">Auto-calculated from DB</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Chart */}
          <Card className="bg-white/90 border border-green-100/50 shadow-md">
            <CardContent className="p-4">
              <ActivityChart />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Recent Activity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { type: "OnRamp", amount: "+$500", time: "2 hours ago", color: "green" },
                { type: "Transfer", amount: "-$150", time: "5 hours ago", color: "blue" },
                { type: "P2P", amount: "-$75", time: "1 day ago", color: "purple" },
              ].map((activity, i) => (
                <Card key={i} className="bg-white/80 border border-gray-100/50 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.color === "green"
                            ? "bg-green-100"
                            : activity.color === "blue"
                            ? "bg-blue-100"
                            : "bg-purple-100"
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-sm ${
                            activity.color === "green"
                              ? "bg-green-500"
                              : activity.color === "blue"
                              ? "bg-blue-500"
                              : "bg-purple-500"
                          }`}
                        ></div>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          activity.amount.startsWith("+") ? "text-green-600" : "text-gray-700"
                        }`}
                      >
                        {activity.amount}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm text-gray-800">{activity.type}</h3>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
