"use client"
import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, Legend } from "recharts"

export default function ActivityChart({ data }: any) {
  // const [data, setData] = useState([])

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const res = await fetch("/api/spending")
  //     const json = await res.json()
  //     setData(json)
  //   }
  //   fetchData()
  // }, [])

  return (
    <div className="w-full h-72 bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-lg border border-green-100/50 p-6 mb-2 backdrop-blur-sm">
      <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        Activity
      </h2>

      <ResponsiveContainer width="100%" height="100%" className={"pt-2"}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />

          <Line
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#22c55e"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
