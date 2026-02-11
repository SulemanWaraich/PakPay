export const dynamic = 'force-dynamic';

import { Card, CardContent } from "../../../components/ui/card"
import prisma from "@repo/db"
import ActivityChart from "../../../components/ChartMerchant"
import { getServerSession } from "next-auth"
import { authOptions } from "../../lib/auth"
import { formatDistanceToNow } from "date-fns"
import { redirect } from "next/navigation"
// import { io } from "socket.io-client";
// import MerchantNotificationListener from "../../../components/MerchantNotificationListener";
import MerchantDashboardClientWrapper from "../../../components/MerchantDashboardClientWrapper";

export default async function MerchantDashboardPage() {
  const session = await getServerSession(authOptions)
//   const socket = io("http://localhost:5001");
//   socket.on("bankWebhookEvent", (data) => {
//   console.log("🔥 LIVE update:", data);
// });

    if (!session?.user?.id || session.user.role !== "MERCHANT") {
      redirect("/auth/signin")
    }
  try {
    

    const merchantUserId = Number(session.user.id)

    const merchant = await prisma.merchantProfile.findUnique({
      where: { userId: merchantUserId }
    })

    console.log("🚀 Merchant Profile:", merchant?.userId) // Debug log
    if (!merchant) {
      redirect("/api/selector")
    }

    const transactions = await prisma.merchantTransaction.findMany({
      where: {
        merchantId: merchant.id,
        status: "SUCCESS"
      },
      orderBy: { createdAt: "asc" }
    })

    const now = new Date()

    // 📊 Daily revenue (chart)
    const dailyRevenue: Record<string, number> = {}
    transactions.forEach(txn => {
      const date = txn.createdAt.toISOString().split("T")[0]
      dailyRevenue[date] = (dailyRevenue[date] || 0) + txn.amount
    })

    const chartData = Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue
    }))

    // 📆 Monthly revenue
    const monthlyRevenue = transactions
      .filter(t => {
        const d = new Date(t.createdAt)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((sum, t) => sum + t.amount, 0)

    // 📆 Weekly revenue
    const weekAgo = new Date()
    weekAgo.setDate(now.getDate() - 7)

    const weeklyRevenue = transactions
      .filter(t => t.createdAt >= weekAgo)
      .reduce((sum, t) => sum + t.amount, 0)

    // 💰 Settlement balances
    const availableBalance = transactions
      .filter(t => t.settled)
      .reduce((sum, t) => sum + t.amount, 0)

    const pendingSettlement = transactions
      .filter(t => !t.settled)
      .reduce((sum, t) => sum + t.amount, 0)

    // 💳 Revenue by payment method
    const revenueByMethod: Record<string, number> = {}
    transactions.forEach(txn => {
      revenueByMethod[txn.paymentMethod] =
        (revenueByMethod[txn.paymentMethod] || 0) + txn.amount
    })

    const recentTransactions = [...transactions].reverse().slice(0, 3)

    return (
      <div className="flex w-screen min-h-screen bg-gradient-to-br from-green-50/30 via-white to-emerald-50/20">
            <MerchantDashboardClientWrapper merchantId={merchant.userId} />
        <main className="flex-1 p-4">
          <div className="max-w-6xl mx-auto">

            <div className="mb-6 mt-2">
              <h1 className="text-3xl font-bold text-emerald-700">Merchant Dashboard</h1>
              <p className="text-sm text-gray-600">
                Auto-settlement every 2 days (T+2)
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">

              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <CardContent className="p-4">
                  <p className="text-xs uppercase">Available Balance</p>
                  <p className="text-3xl font-bold">
                    ${availableBalance.toLocaleString()}
                  </p>
                  <p className="text-xs">Settled to bank</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">This Month</p>
                  <p className="text-2xl font-bold">
                    ${monthlyRevenue.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">This Week</p>
                  <p className="text-2xl font-bold">
                    ${weeklyRevenue.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Pending Settlement</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${pendingSettlement.toLocaleString()}
                  </p>
                  <p className="text-xs">Auto off-ramp in T+2</p>
                </CardContent>
              </Card>

            </div>

            <Card className="mb-6">
              <CardContent className="p-4">
                <ActivityChart data={chartData} />
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardContent className="p-4">
                <h2 className="font-semibold mb-3">Revenue by Payment Method</h2>
                <ul className="space-y-2 text-sm">
                  {Object.entries(revenueByMethod).map(([method, amount]) => (
                    <li key={method} className="flex justify-between">
                      <span>{method}</span>
                      <span>${amount.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div>
              <h2 className="font-semibold mb-4">Recent Payments</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentTransactions.map(txn => (
                  <Card key={txn.id}>
                    <CardContent className="p-3">
                      <p className="font-medium">${txn.amount}</p>
                      <p className="text-xs text-gray-500">
                        {txn.paymentMethod}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(txn.createdAt, { addSuffix: true })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    )
  } catch (err) {
    console.error(err)
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <h1 className="text-red-600 text-xl">
          Failed to load merchant dashboard
        </h1>
      </div>
    )
  }
}
