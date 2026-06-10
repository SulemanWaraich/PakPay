// @ts-nocheck
export const dynamic = 'force-dynamic';

import StatementExportButton from "../../../components/StatementExportButton"
import { Card, CardContent } from "../../../components/ui/card"
import prisma from "@repo/db"
import ActivityChart from "../../../components/ChartMerchant"
import { getServerSession } from "next-auth"
import { authOptions } from "../../lib/auth"
import { formatDistanceToNow } from "date-fns"
import { redirect } from "next/navigation"
import MerchantDashboardClientWrapper from "../../../components/MerchantDashboardClientWrapper"
import TopCustomers from "../../../components/TopCustomers"
// import KycProgressTracker from "../../../components/merchant/KycProgressTracker"
import { paisaToPkr } from "../../lib/money"
import { availableBalancePaisa } from "../../lib/balance"

export default async function MerchantDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== "MERCHANT") {
    redirect("/auth/signin")
  }

  try {
    const merchantUserId = Number(session.user.id)

    const merchant = await prisma.merchantProfile.findUnique({
      where: { userId: merchantUserId },
      include: { user: true },
    })

    if (!merchant) {
      redirect("/auth/onBoarding")
    }

    const [balanceRow, pendingSettlementResult] = await Promise.all([
      prisma.balance.findUnique({
        where: { userId: merchantUserId },
      }),
      prisma.merchantTransaction.aggregate({
        where: {
          merchantId: merchant.id,
          status: "SUCCESS",
          settled: false,
        },
        _sum: { amount: true },
      }),
    ])

    const availableBalance = availableBalancePaisa(
      balanceRow?.amount ?? 0,
      balanceRow?.locked ?? 0,
    )
    const pendingSettlement = pendingSettlementResult._sum.amount ?? 0

    const transactions = await prisma.merchantTransaction.findMany({
      where: {
        merchantId: merchant.id,
        status: "SUCCESS",
      },
      include: {
        customer: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "asc" },
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
      revenue: paisaToPkr(revenue),
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

    // 💳 Revenue by payment method
    const revenueByMethod: Record<string, number> = {}
    transactions.forEach(txn => {
      revenueByMethod[txn.paymentMethod] =
        (revenueByMethod[txn.paymentMethod] || 0) + txn.amount
    })

    // 🕐 Recent transactions
    const recentTransactions = [...transactions].reverse().slice(0, 3)

    // 👥 Top Customers
    const customerMap: Record<number, { name: string; total: number; count: number; lastSeen: Date }> = {}

    for (const txn of transactions) {
      if (!txn.customerId) continue
      if (!customerMap[txn.customerId]) {
        customerMap[txn.customerId] = {
          name: txn.customer?.name ?? `Customer #${txn.customerId}`,
          total: 0,
          count: 0,
          lastSeen: txn.createdAt,
        }
      }
      customerMap[txn.customerId].total += txn.amount
      customerMap[txn.customerId].count += 1
      if (txn.createdAt > customerMap[txn.customerId].lastSeen) {
        customerMap[txn.customerId].lastSeen = txn.createdAt
      }
    }

    const topCustomers = Object.entries(customerMap)
      .map(([id, data]) => ({
        id,
        name: data.name,
        total: paisaToPkr(data.total),
        count: data.count,
        lastSeen: data.lastSeen,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    return (
      <>
  
 
      <div className=" min-h-screen bg-gradient-to-br from-green-50/30 via-white to-emerald-50/20">
        <MerchantDashboardClientWrapper
          merchantUserId={merchant.userId}
          merchantProfileId={merchant.id}
        />
        <main className="flex-1 p-4">
          <div className="max-w-6xl mx-auto">

             {/* <KycProgressTracker
              kycStatus={merchant.kycStatus}
              businessName={merchant.businessName}
              kycReviewNote={merchant.kycReviewNote}
            />  */}

            {/* Greeting */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="sm:text-4xl text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-1 mb-1">
                  Good Afternoon, {merchant?.user?.name}
                </h1>
                <p className="text-gray-600 text-sm ml-4">Welcome back to your merchant dashboard</p>
              </div>
              <StatementExportButton />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <CardContent className="p-4">
                  <p className="text-xs uppercase">Available Balance</p>
                  <p className="text-3xl font-bold">PKR {paisaToPkr(availableBalance).toLocaleString()}</p>
                  <p className="text-xs">Available to withdraw (after locks)</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">This Month</p>
                  <p className="text-2xl font-bold">PKR {paisaToPkr(monthlyRevenue).toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">This Week</p>
                  <p className="text-2xl font-bold">PKR {paisaToPkr(weeklyRevenue).toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Pending Settlement</p>
                  <p className="text-2xl font-bold text-orange-600">PKR {paisaToPkr(pendingSettlement).toLocaleString()}</p>
                  <p className="text-xs">Successful payments awaiting T+2 payout</p>
                </CardContent>
              </Card>
            </div>

            {/* Activity Chart */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <ActivityChart data={chartData} />
              </CardContent>
            </Card>

            {/* Top Customers */}
            <TopCustomers customers={topCustomers} />

            {/* Revenue by Payment Method */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <h2 className="font-semibold mb-3">Revenue by Payment Method</h2>
                <ul className="space-y-2 text-sm">
                  {Object.entries(revenueByMethod).map(([method, amount]) => (
                    <li key={method} className="flex justify-between">
                      <span>{method}</span>
                      <span>PKR {paisaToPkr(amount).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <div>
              <h2 className="font-semibold mb-4">Recent Payments</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentTransactions.map(txn => (
                  <Card key={txn.id}>
                    <CardContent className="p-3">
                      <p className="font-medium">PKR {paisaToPkr(txn.amount).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{txn.paymentMethod}</p>
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
      </>
    )
  } catch (err) {
    console.error(err)
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <h1 className="text-red-600 text-xl">Failed to load merchant dashboard</h1>
      </div>
    )
  }
}
