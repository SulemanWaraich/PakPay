import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Calendar, Filter, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { cn } from "../../lib/utils"
import prisma from "@repo/db"
import { getServerSession } from "next-auth"
import { authOptions } from "../../lib/auth"
import FilterForm from "../../../components/FilterForm"
import ExportButton from "../../../components/ExportButton"

interface SearchParams {
  type?: string
  startDate?: string
  endDate?: string
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return (
      <div className="p-8">
        <h2 className="text-xl text-red-500">You must be signed in to view transactions.</h2>
      </div>
    )
  }

  // Parse filter parameters
  const typeFilter = searchParams.type
  const startDate = searchParams.startDate ? new Date(searchParams.startDate) : undefined
  const endDate = searchParams.endDate ? new Date(searchParams.endDate + "T23:59:59") : undefined

  // Build where conditions for filtering
  const dateFilter = {
    ...(startDate && { gte: startDate }),
    ...(endDate && { lte: endDate }),
  }

  // Fetch transactions with filters
  let onrampTx: any[] = []
  let offrampTx: any[] = []
  let p2pTx: any[] = []

  if (!typeFilter || typeFilter === "all" || typeFilter === "deposit") {
    onrampTx = await prisma.onRampTransaction.findMany({
      where: {
        userId: Number(session.user.id),
        ...(Object.keys(dateFilter).length > 0 && { startTime: dateFilter }),
      },
      orderBy: { startTime: "desc" },
    })
  }

  if (!typeFilter || typeFilter === "all" || typeFilter === "withdrawal") {
    offrampTx = await prisma.offRampTransaction.findMany({
      where: {
        userId: Number(session.user.id),
        ...(Object.keys(dateFilter).length > 0 && { startTime: dateFilter }),
      },
      orderBy: { startTime: "desc" },
    })
  }

  if (!typeFilter || typeFilter === "all" || typeFilter === "p2p") {
    p2pTx = await prisma.p2pTransfer.findMany({
      where: {
        OR: [
          { fromUserId: Number(session.user.id) },
          { toUserId: Number(session.user.id) },
        ],
        ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: "desc" },
    })
  }

  // Normalize to a common structure
  const allTransactions = [
    ...onrampTx.map((tx) => ({
      id: `onramp-${tx.id}`,
      type: "Deposit (On-Ramp)",
      date: new Date(tx.startTime).toLocaleDateString(),
      time: new Date(tx.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      amount: tx.amount,
      currency: tx.provider || "Bank",
      status: tx.status || "Processing",
      isPositive: true,
      timestamp: tx.startTime,
      rawData: tx,
    })),
    ...offrampTx.map((tx) => ({
      id: `offramp-${tx.id}`,
      type: "Withdrawal (Off-Ramp)",
      date: new Date(tx.startTime).toLocaleDateString(),
      time: new Date(tx.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      amount: tx.amount,
      currency: tx.bankAccount || "Bank",
      status: tx.status || "Processing",
      isPositive: false,
      timestamp: tx.startTime,
      rawData: tx,
    })),
    ...p2pTx.map((tx) => {
      const isSender = tx.fromUserId === Number(session.user.id)
      return {
        id: `p2p-${tx.id}`,
        type: isSender ? "P2P Sent" : "P2P Received",
        date: new Date(tx.timestamp).toLocaleDateString(),
        time: new Date(tx.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        amount: tx.amount,
        currency: "PKR",
        status: "Completed",
        isPositive: !isSender, // Sent = negative, Received = positive
        timestamp: tx.timestamp,
        rawData: tx,
      }
    }),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Calculate statistics
  const totalDeposits = allTransactions.filter((tx) => tx.isPositive).reduce((sum, tx) => sum + Number(tx.amount), 0)
  const totalWithdrawals = allTransactions.filter((tx) => !tx.isPositive).reduce((sum, tx) => sum + Number(tx.amount), 0)
  const netAmount = totalDeposits - totalWithdrawals

  // Check for active filters
  const hasActiveFilters = typeFilter || startDate || endDate

  

  return (
    <div className="min-h-screen bg-gray-50 w-full">

      <div className="max-w-6xl sm:mx-auto ml-4 sm:p-6 space-y-6 sm:w-[100%] w-[88%]">
        {/* Page Header */}
        <div className="sm:text-left text-center">
          <h1 className="pt-4 text-2xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
            Transactions
          </h1>
          <p className="text-gray-600 sm:text-md text-sm">Track and manage your financial activities</p>
        </div>

        {/* Filter Section */}
        <Card className="pt-4">
          <CardContent>
            <FilterForm
              currentType={typeFilter}
              currentStartDate={searchParams.startDate}
              currentEndDate={searchParams.endDate}
            />

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                {typeFilter && typeFilter !== "all" && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Type: {typeFilter === "deposit" ? "Deposits" : typeFilter === "withdrawal" ? "Withdrawals" : "P2P"}
                  </Badge>
                )}
                {startDate && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    From: {new Date(startDate).toLocaleDateString()}
                  </Badge>
                )}
                {endDate && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    To: {new Date(searchParams.endDate!).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className=" overflow-hidden">
          {/* Responsive Header */}
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="sm:text-lg text-sm text-green-700 flex items-center gap-2">
              Transaction History
            </CardTitle>
            
              <ExportButton transactions={allTransactions} />
            
          </CardHeader>

          {/* Responsive Transactions */}
          <CardContent className="px-3 sm:px-6 space-y-3">
            {allTransactions.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-green-200">
                <div className="text-green-600 mb-2">
                  <Filter className="h-12 w-12 mx-auto opacity-50" />
                </div>
                <p className="text-gray-500 text-lg">
                  {hasActiveFilters ? "No transactions match your filters" : "No transactions found"}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" className="mt-4" asChild>
                    <a href="/transactions">Clear all filters</a>
                  </Button>
                )}
              </Card>
            ) : (
              allTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border p-3 hover:bg-gray-50"
                >
                  {/* Left side */}
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "p-2 rounded-full",
                        transaction.isPositive
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      )}
                    >
                      {transaction.isPositive ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{transaction.type}</p>
                      <p className="text-xs text-gray-500">
                        {transaction.date}, {transaction.time}
                      </p>
                      <p className="text-xs text-gray-600">{transaction.currency}</p>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-3 sm:text-right">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        transaction.isPositive ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {transaction.isPositive ? "+" : "-"}Rs {Number(transaction.amount).toLocaleString()}
                    </p>
                    <Badge
                      className={cn(
                        "text-xs px-2 py-0.5",
                        transaction.status === "Success"
                          ? "bg-green-100 text-green-700"
                          : transaction.status === "Failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      )}
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        {allTransactions.length > 0 && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center p-4">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-base font-bold text-green-600">{allTransactions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Deposits</p>
                <p className="text-base font-bold text-green-600">Rs {totalDeposits.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Withdrawals</p>
                <p className="text-base font-bold text-red-600">Rs {totalWithdrawals.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Amount</p>
                <p className={cn("text-base font-bold", netAmount >= 0 ? "text-green-600" : "text-red-600")}>
                  Rs {netAmount >= 0 ? "+" : ""}
                  {netAmount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  )
}
