// app/api/merchant/statement/route.ts
// Generates a downloadable PDF statement for the authenticated merchant.
// Query params:
//   ?month=2025-05   → filters to that calendar month
//   ?from=2025-05-01&to=2025-05-31  → custom date range (fallback)
//   (no params)      → all-time statement

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../lib/auth"
import prisma from "@repo/db"
import { generateMerchantStatementPDF } from "../../../lib/pdf/merchantStatement"
import { paisaToPkr } from "../../../lib/money"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "MERCHANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const merchantUserId = Number(session.user.id)
    const merchant = await prisma.merchantProfile.findUnique({
      where: { userId: merchantUserId },
      include: { user: true },
    })
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
    }

    // ── Parse period from query params ──────────────────────────────────
    const { searchParams } = new URL(req.url)
    const monthParam = searchParams.get("month")   // e.g. "2025-05"
    const fromParam  = searchParams.get("from")    // e.g. "2025-05-01"
    const toParam    = searchParams.get("to")      // e.g. "2025-05-31"

    let dateFilter: { gte?: Date; lte?: Date } = {}
    let periodLabel = "All Time"

    if (monthParam) {
      const [year, month] = monthParam.split("-").map(Number)
      const start = new Date(year, month - 1, 1)
      const end   = new Date(year, month, 0, 23, 59, 59, 999)
      dateFilter  = { gte: start, lte: end }
      periodLabel = start.toLocaleString("default", { month: "long", year: "numeric" })
    } else if (fromParam && toParam) {
      dateFilter  = { gte: new Date(fromParam), lte: new Date(toParam) }
      periodLabel = `${fromParam} to ${toParam}`
    }

    // ── Fetch transactions ──────────────────────────────────────────────
    const transactions = await prisma.merchantTransaction.findMany({
      where: {
        merchantId: merchant.id,
        status: "SUCCESS",
        ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
      },
      orderBy: { createdAt: "asc" },
    })

    // ── Build summary ───────────────────────────────────────────────────
    const total   = transactions.reduce((s, t) => s + t.amount, 0)
    const settled = transactions.filter(t => t.settled).reduce((s, t) => s + t.amount, 0)
    const pending = total - settled

    const txnRows = transactions.map(t => ({
      date:    t.createdAt.toISOString().split("T")[0],
      amount:  paisaToPkr(t.amount),
      method:  t.paymentMethod,
      settled: t.settled,
    }))

    // ── Generate PDF ────────────────────────────────────────────────────
    const pdfBytes = await generateMerchantStatementPDF({
      merchantName: merchant.user.name ?? "Merchant",
      merchantId:   String(merchant.userId),
      periodLabel,
      transactions: txnRows,
      summary: {
        total: paisaToPkr(total),
        settled: paisaToPkr(settled),
        pending: paisaToPkr(pending),
        count: transactions.length,
      },
    })

    const filename = `pakpay-statement-${periodLabel.replace(/\s+/g, "-").toLowerCase()}.pdf`

    return new NextResponse(pdfBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length":      String(pdfBytes.length),
      },
    })
  } catch (err) {
    console.error("[Statement PDF Error]", err)
    return NextResponse.json({ error: "Failed to generate statement" }, { status: 500 })
  }
}
