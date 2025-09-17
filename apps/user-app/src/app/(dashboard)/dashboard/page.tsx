import { Card, CardContent } from "../../../components/ui/card"
import prisma from "@repo/db"
import ActivityChart from "../../../components/ChartClient"

export default async function DashboardPage() {
  // ✅ Fetch OnRamp Transactions
  const onRamps = await prisma.onRampTransaction.findMany({
    where: { status: "Success" },
    orderBy: { startTime: "asc" },
  })

  // ✅ Fetch OffRamp Transactions
  const offRamps = await prisma.offRampTransaction.findMany({
    where: { status: "Success" },
    orderBy: { startTime: "asc" },
  })

  // ✅ Fetch P2P Transfers
  const transfers = await prisma.p2pTransfer.findMany({
    orderBy: { timestamp: "asc" },
  })

  // ✅ Merge into single structure {date, onRamp, offRamp, p2p}
  const dailyData: Record<string, { onRamp: number; offRamp: number; p2p: number }> = {}

  // OnRamp
  onRamps.forEach((txn) => {
    const date = txn.startTime.toISOString().split("T")[0]
    if (!dailyData[date]) dailyData[date] = { onRamp: 0, offRamp: 0, p2p: 0 }
    dailyData[date].onRamp += txn.amount
  })

  // OffRamp
  offRamps.forEach((txn) => {
    const date = txn.startTime.toISOString().split("T")[0]
    if (!dailyData[date]) dailyData[date] = { onRamp: 0, offRamp: 0, p2p: 0 }
    dailyData[date].offRamp += txn.amount
  })

  // P2P
  transfers.forEach((txn) => {
    const date = txn.timestamp.toISOString().split("T")[0]
    if (!dailyData[date]) dailyData[date] = { onRamp: 0, offRamp: 0, p2p: 0 }
    dailyData[date].p2p += txn.amount
  })

  // ✅ Convert to array sorted by date
  const chartData = Object.entries(dailyData)
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // ✅ Fetch Balance
  const balance = await prisma.balance.findFirst({
    where: { userId: 1 }, // TODO: session-based userId
  })

  return (
    <div className="flex w-screen min-h-screen bg-gradient-to-br from-green-50/30 via-white to-emerald-50/20">
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Good afternoon, Suleman
              </h1>
            </div>
            <p className="text-gray-600 text-lg ml-6">Welcome back to your financial dashboard</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Portfolio Value Card */}
            <Card className="lg:col-span-1 bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-xl text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-white/80 rounded-full"></div>
                  <p className="text-green-100 text-sm font-medium uppercase tracking-wide">Portfolio Value</p>
                </div>
                <p className="text-5xl font-bold mb-2">${balance?.amount ?? 0}</p>
                <div className="flex items-center gap-2 text-green-100">
                  <div className="w-1 h-1 bg-green-200 rounded-full"></div>
                  <span className="text-sm">Total Balance</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-green-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <div className="w-6 h-6 bg-green-500 rounded-md"></div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">24</p>
                      <p className="text-sm text-gray-600">This Month</p>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">Total Transactions</h3>
                  <p className="text-sm text-green-600 font-medium">+12% from last month</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border border-green-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <div className="w-6 h-6 bg-blue-500 rounded-md"></div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">$2,450</p>
                      <p className="text-sm text-gray-600">This Week</p>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">Weekly Spending</h3>
                  <p className="text-sm text-blue-600 font-medium">-8% from last week</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm border border-green-100/50 shadow-xl">
            <CardContent className="p-8">
              <ActivityChart />
            </CardContent>
          </Card>

          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Recent Activity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { type: "OnRamp", amount: "+$500", time: "2 hours ago", color: "green" },
                { type: "Transfer", amount: "-$150", time: "5 hours ago", color: "blue" },
                { type: "P2P", amount: "-$75", time: "1 day ago", color: "purple" },
              ].map((activity, index) => (
                <Card
                  key={index}
                  className="bg-white/80 backdrop-blur-sm border border-gray-100/50 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.color === "green"
                            ? "bg-green-100"
                            : activity.color === "blue"
                              ? "bg-blue-100"
                              : "bg-purple-100"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-sm ${
                            activity.color === "green"
                              ? "bg-green-500"
                              : activity.color === "blue"
                                ? "bg-blue-500"
                                : "bg-purple-500"
                          }`}
                        ></div>
                      </div>
                      <span
                        className={`text-lg font-semibold ${
                          activity.amount.startsWith("+") ? "text-green-600" : "text-gray-700"
                        }`}
                      >
                        {activity.amount}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-800 mb-1">{activity.type}</h3>
                    <p className="text-sm text-gray-500">{activity.time}</p>
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
