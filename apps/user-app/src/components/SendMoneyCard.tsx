"use client"
import { Button, Card, TextInput } from "@repo/ui"
import { useState } from "react"
import { p2pTransfer } from "../app/lib/actions/p2pTransfer"
import { showToast } from "../app/lib/toastMessage"

export const SendMoneyCard = () => {
  const [amount, setAmount] = useState("")
  const [number, setNumber] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSendMoney = async () => {
    if (!number || !amount) {
      showToast("warning", "Please enter both account number and amount.")
      return
    }

    if (Number(amount) <= 0) {
      showToast("warning", "Enter a valid amount greater than zero.")
      return
    }

    setLoading(true)
    showToast("info", "Processing your transaction...")

    const response = await p2pTransfer(number, Number(amount) * 100)
    setLoading(false)

    if (response.success) {
      showToast("success", response.message)
      setAmount("")
      setNumber("")
    } else {
      showToast("error", response.message)
    }
  }

  return (
    <Card title="Send Money">
      <div className="w-full p-2">
        <TextInput
          label="Account Number"
          placeholder="Enter receiver's account number"
          onChange={(value) => setNumber(value)}
          
        />
        <TextInput
          label="Amount"
          placeholder="Enter amount"
          onChange={(value) => setAmount(value)}
          
        />

        <div className="flex justify-center pt-4">
          <Button onClick={handleSendMoney}>
            {loading ? "Sending..." : "Send Money"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
