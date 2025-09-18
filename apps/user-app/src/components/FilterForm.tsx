"use client"

import { Button } from "../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { X, Search } from "lucide-react"
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
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Transaction Type Filter */}
        <div className="space-y-1">
          <Label htmlFor="type" className="text-xs font-medium text-gray-700">
            Type
          </Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type" className="w-full h-8 text-xs">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="deposit">Deposits</SelectItem>
              <SelectItem value="withdrawal">Withdrawals</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Date Filter */}
        <div className="space-y-1">
          <Label htmlFor="startDate" className="text-xs font-medium text-gray-700">
            Start
          </Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full h-8 text-xs"
          />
        </div>

        {/* End Date Filter */}
        <div className="space-y-1">
          <Label htmlFor="endDate" className="text-xs font-medium text-gray-700">
            End
          </Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full h-8 text-xs"
            min={startDate || undefined}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col justify-end gap-1">
          <Button 
            onClick={handleFilter}
            className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs"
          >
            <Search className="h-3 w-3 mr-1" />
            Apply
          </Button>
          {hasFilters && (
            <Button 
              onClick={handleClear}
              variant="outline"
              className="border-gray-300 h-8 px-3 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
