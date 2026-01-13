"use client"

import { User, Store } from "lucide-react"
import { useState } from "react"
import { AppbarClient } from "../../../components/AppbarClient"
import Link from "next/link"

export default function AccountSelector() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  return (
    
    <div className="w-full">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 mt-4">Choose Your PakPay Account</h1>
        <p className="text-gray-600 text-lg">Select how you want to use our platform to get started.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 px-16">
        {/* User Account Card */}
        <div
          className="bg-white rounded-2xl p-8  shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
          onMouseEnter={() => setHoveredCard("user")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-green-200 rounded-full flex items-center justify-center mb-6">
              <User className="w-12 h-12 text-green-700" strokeWidth={1.5} />
            </div>

            <p className="text-sm text-gray-600 mb-2">Register as User</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">For Individuals</h2>

            <p className="text-center text-gray-600 mb-8 leading-relaxed">
              Pay bills, transfer money, and shop online securely with ease. Manage your personal finances in one place.
            </p>

        <Link href={"/auth/signup?role=USER"}>

            <button
              className={`w-full py-3 px-6 bg-green-400 hover:bg-green-500 text-gray-900 font-semibold rounded-full transition-all duration-300 ${
                hoveredCard === "user" ? "shadow-lg scale-105" : "shadow-md"
              }`}
            >
              Select User Account
            </button>
        </Link>
          </div>
        </div>

        {/* Merchant Account Card */}
        <div
          className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
          onMouseEnter={() => setHoveredCard("merchant")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-green-200 rounded-full flex items-center justify-center mb-6">
              <Store className="w-12 h-12 text-green-700" strokeWidth={1.5} />
            </div>

            <p className="text-sm text-gray-600 mb-2">Register as Merchant</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">For Businesses</h2>

            <p className="text-center text-gray-600 mb-8 leading-relaxed">
              Accept payments, manage transactions, and grow your business with our robust tools and analytics.
            </p>

<Link href={"/auth/signup?role=MERCHANT"}>
 <button
              className={`w-full py-3 px-6 bg-green-400 hover:bg-green-500 text-gray-900 font-semibold rounded-full transition-all duration-300 ${
                hoveredCard === "merchant" ? "shadow-lg scale-105" : "shadow-md"
              }`}
            >
              Select Merchant Account
            </button>
</Link>
           
          </div>
        </div>
      </div>
    </div>
    
  )
}
