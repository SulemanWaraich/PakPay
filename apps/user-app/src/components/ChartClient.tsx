"use client"
import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, Legend } from "recharts"

export default function ActivityChart() {
  const [data, setData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/spending")
      const json = await res.json()
      setData(json)
    }
    fetchData()
  }, [])

  return (
    <div className="w-full h-72 bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-lg border border-green-100/50 p-6 mb-2 backdrop-blur-sm">
      <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        Activity
      </h2>

      <ResponsiveContainer width="100%" height="100%" className={"pt-2"}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.6} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
            }}
          />

          {/* <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} iconSize={10} iconType="circle" align="center" layout="horizontal" /> */}

          <Legend
            content={({ payload }) => (
              <div className="hidden sm:flex justify-center gap-4 text-sm ">
                {payload?.map((entry, index) => (
                  <div key={`item-${index}`} className="flex items-center gap-1 ">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    ></span>
                    {entry.value}
                  </div>
                )) ?? null}
              </div>
            )}
          />


          {/* Background area for spending
          <Area type="monotone" dataKey="spend" stroke="none" fill="rgba(79,70,229,0.1)" /> */}

          {/* Spending Line (Outgoing) */}
          <Line
            type="monotone"
            dataKey="offRamp"
            name="Withdrawal"
            stroke="#4f46e5"
            strokeWidth={3}
            dot={{ r: 5, fill: "#4f46e5", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 7, stroke: "#4f46e5", strokeWidth: 2, fill: "#fff" }}
          />

          {/* P2P Line */}
          <Line
            type="monotone"
            dataKey="p2p"
            name="P2P"
            stroke="#9333ea"
            strokeWidth={3}
            dot={{ r: 5, fill: "#9333ea", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 7, stroke: "#9333ea", strokeWidth: 2, fill: "#fff" }}
          />
          {/* OnRamp Line (Incoming) */}
          <Line
            type="monotone"
            dataKey="onRamp"
            name="Deposit"
            stroke="#22c55e"
            strokeWidth={3}
            dot={{ r: 5, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 7, stroke: "#22c55e", strokeWidth: 2, fill: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
