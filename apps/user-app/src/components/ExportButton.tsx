"use client"

import { Button } from "../components/ui/button"
import { Download } from "lucide-react"
import { toast } from "sonner"

interface Transaction {
  id: string
  type: string
  date: string
  time: string
  amount: number
  currency: string
  status: string
  isPositive: boolean
  timestamp: Date
}

interface ExportButtonProps {
  transactions: Transaction[]
}

export default function ExportButton({ transactions }: ExportButtonProps) {
  
  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export")
      return
    }

    // CSV headers
    const headers = ["ID", "Type", "Date", "Time", "Amount (Rs)", "Currency/Provider", "Status"]
    
    // Convert transactions to CSV format
    const csvData = transactions.map(transaction => [
      transaction.id,
      transaction.type,
      transaction.date,
      transaction.time,
      `${transaction.isPositive ? "+" : "-"}${transaction.amount}`,
      transaction.currency,
      transaction.status
    ])

    // Combine headers and data
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `transactions-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success(`Exported ${transactions.length} transactions to CSV`)
    } else {
      toast.error("Export not supported in this browser")
    }
  }

  return (
    <Button 
      onClick={exportToCSV}
      variant="outline"
      className="border-green-300 text-green-700 hover:bg-green-50 max-w-44 text-xs"
      disabled={transactions.length === 0}
    >
      <Download className="sm:h-4 sm:w-4 sm:mr-2" />
      {/* Mobile only */}
      <span className="sm:hidden">Export</span>
      {/* Desktop only */}
      <span className="hidden sm:inline">
        Export {transactions.length} transactions
      </span>
    </Button>
  )
}