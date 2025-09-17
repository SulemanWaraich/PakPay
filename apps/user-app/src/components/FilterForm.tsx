"use client"

import { Button } from "../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Filter, X, Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

interface FilterFormProps {
  currentType?: string
  currentStartDate?: string
  currentEndDate?: string
}

export default function FilterForm({ currentType, currentStartDate, currentEndDate }: FilterFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [type, setType] = useState(currentType || "all")
  const [startDate, setStartDate] = useState(currentStartDate || "")
  const [endDate, setEndDate] = useState(currentEndDate || "")

  const handleFilter = () => {
    const params = new URLSearchParams()
    
    if (type && type !== "all") {
      params.set("type", type)
    }
    if (startDate) {
      params.set("startDate", startDate)
    }
    if (endDate) {
      params.set("endDate", endDate)
    }

    const queryString = params.toString()
    router.push(`/transactions${queryString ? `?${queryString}` : ""}`)
  }

  const handleClear = () => {
    setType("all")
    setStartDate("")
    setEndDate("")
    router.push("/transactions")
  }

  const hasFilters = (type && type !== "all") || startDate || endDate

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Transaction Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="type" className="text-sm font-medium text-gray-700">
            Transaction Type
          </Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type" className="w-full">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposits Only</SelectItem>
              <SelectItem value="withdrawal">Withdrawals Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
            Start Date
          </Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full"
          />
        </div>

        {/* End Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">
            End Date
          </Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full"
            min={startDate || undefined}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col justify-end gap-2">
          <Button 
            onClick={handleFilter}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Search className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
          {hasFilters && (
            <Button 
              onClick={handleClear}
              variant="outline"
              className="border-gray-300"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        
      </div>
    </div>
  )
}