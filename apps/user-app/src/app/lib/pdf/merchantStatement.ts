// lib/pdf/merchantStatement.ts
// PDF generator using pdf-lib — fully compatible with Next.js App Router.
// Install: npm install pdf-lib

import { PDFDocument, rgb, StandardFonts, RGB } from "pdf-lib"

interface TransactionRow {
  date: string
  amount: number
  method: string
  settled: boolean
}

interface StatementSummary {
  total: number
  settled: number
  pending: number
  count: number
}

interface StatementInput {
  merchantName: string
  merchantId: string
  periodLabel: string
  transactions: TransactionRow[]
  summary: StatementSummary
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace("#", ""), 16)
  return rgb((n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255)
}

const C = {
  green:      hexToRgb("#059669"),
  greenDark:  hexToRgb("#065f46"),
  greenLight: hexToRgb("#d1fae5"),
  gray900:    hexToRgb("#111827"),
  gray600:    hexToRgb("#4b5563"),
  gray400:    hexToRgb("#9ca3af"),
  gray100:    hexToRgb("#f3f4f6"),
  orange:     hexToRgb("#ea580c"),
  white:      rgb(1, 1, 1),
  border:     hexToRgb("#e5e7eb"),
}

const PAGE_W  = 595.28  // A4
const PAGE_H  = 841.89
const MARGIN  = 40
const CONTENT_W = PAGE_W - MARGIN * 2

export async function generateMerchantStatementPDF(input: StatementInput): Promise<Buffer> {
  const { merchantName, merchantId, periodLabel, transactions, summary } = input

  const doc      = await PDFDocument.create()
  const bold     = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular  = await doc.embedFont(StandardFonts.Helvetica)

  const page = doc.addPage([PAGE_W, PAGE_H])

  const generated = new Date().toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC"

  // pdf-lib Y axis: 0 = bottom of page, so we track from top
  let y = PAGE_H - MARGIN

  // ── Utility: draw text (y is top of text baseline area) ─────────────────────
  const text = (
    str: string,
    x: number,
    topY: number,
    size: number,
    color: RGB,
    isBold = false,
  ) => {
    page.drawText(str, {
      x,
      y: topY,
      size,
      font: isBold ? bold : regular,
      color,
    })
  }

  const hline = (lineY: number, color = C.gray400, thickness = 0.5) => {
    page.drawLine({
      start: { x: MARGIN, y: lineY },
      end:   { x: MARGIN + CONTENT_W, y: lineY },
      thickness,
      color,
    })
  }

  const rect = (
    x: number, rectY: number, w: number, h: number,
    fillColor: RGB, strokeColor?: RGB, thickness = 0.8,
  ) => {
    page.drawRectangle({
      x, y: rectY, width: w, height: h,
      color: fillColor,
      borderColor: strokeColor,
      borderWidth: strokeColor ? thickness : 0,
    })
  }

  // ── HEADER BANNER ─────────────────────────────────────────────────────────
  const bannerH = 60
  const bannerY = y - bannerH
  rect(MARGIN, bannerY, CONTENT_W, bannerH, C.greenDark)

  text("PakPay",              MARGIN + 16, bannerY + 38, 22, C.white,      true)
  text("Secure Digital Payments", MARGIN + 16, bannerY + 10, 9,  C.greenLight)
  text(`${periodLabel} Statement`, MARGIN + CONTENT_W - 180, bannerY + 35, 11, C.white, true)

  y = bannerY - 12

  // ── MERCHANT INFO BAR ─────────────────────────────────────────────────────
  const infoH = 48
  const infoY = y - infoH
  rect(MARGIN, infoY, CONTENT_W, infoH, C.gray100)

  const colW = CONTENT_W / 3
  const infoItems = [
    { label: "MERCHANT",     value: merchantName },
    { label: "MERCHANT ID",  value: `#${merchantId}` },
    { label: "GENERATED",    value: generated },
  ]
  infoItems.forEach((item, i) => {
    const x = MARGIN + i * colW + 12
    text(item.label,  x, infoY + 30, 7,  C.gray400)
    text(item.value,  x, infoY + 14, 10, C.gray900, true)
  })
  // vertical dividers
  for (let i = 1; i < 3; i++) {
    page.drawLine({
      start: { x: MARGIN + i * colW, y: infoY + 8  },
      end:   { x: MARGIN + i * colW, y: infoY + 40 },
      thickness: 0.5,
      color: C.gray400,
    })
  }

  y = infoY - 16

  // ── SUMMARY CARDS ─────────────────────────────────────────────────────────
  const cardH = 70
  const cardW = (CONTENT_W - 12) / 4
  const cardY = y - cardH

  const cards = [
    { label: "TOTAL REVENUE",      value: `PKR ${summary.total.toLocaleString("en", { minimumFractionDigits: 2 })}`,    color: C.green  },
    { label: "SETTLED",            value: `PKR ${summary.settled.toLocaleString("en", { minimumFractionDigits: 2 })}`,  color: C.gray900 },
    { label: "PENDING SETTLEMENT", value: `PKR ${summary.pending.toLocaleString("en", { minimumFractionDigits: 2 })}`,  color: C.orange },
    { label: "TRANSACTIONS",       value: String(summary.count),                                                          color: C.gray900 },
  ]

  cards.forEach((card, i) => {
    const x = MARGIN + i * (cardW + 4)
    rect(x, cardY, cardW, cardH, C.white, C.border)
    text(card.label, x + 10, cardY + cardH - 14, 7, C.gray400)
    text(card.value, x + 10, cardY + cardH - 36, 13, card.color, true)
  })

  y = cardY - 24

  // ── TABLE TITLE ───────────────────────────────────────────────────────────
  text("Transaction History", MARGIN, y, 13, C.gray900, true)
  y -= 20

  // ── TABLE HEADER ──────────────────────────────────────────────────────────
  const rowH = 22
  const cols = [
    { label: "DATE",    width: 80  },
    { label: "AMOUNT",  width: 80  },
    { label: "METHOD",  width: 130 },
    { label: "STATUS",  width: 80  },
    { label: "SETTLED", width: 80  },
  ]

  const headerY = y - rowH
  rect(MARGIN, headerY, CONTENT_W, rowH, C.green)

  let xCursor = MARGIN
  cols.forEach(col => {
    text(col.label, xCursor + 6, headerY + 7, 7, C.white, true)
    xCursor += col.width
  })

  y = headerY

  // ── TABLE ROWS ────────────────────────────────────────────────────────────
  const maxRows = Math.floor((y - MARGIN - 40) / rowH)

  transactions.slice(0, maxRows).forEach((txn, idx) => {
    const rowY = y - rowH * (idx + 1)
    const bg   = idx % 2 === 0 ? C.white : C.gray100
    rect(MARGIN, rowY, CONTENT_W, rowH, bg)
    hline(rowY, C.border, 0.3)

    const values: { t: string; color: RGB; bold?: boolean }[] = [
      { t: txn.date,                              color: C.gray600 },
      { t: `PKR ${txn.amount.toFixed(2)}`,        color: C.green,   bold: true },
      { t: txn.method,                            color: C.gray900 },
      { t: "SUCCESS",                             color: C.green },
      { t: txn.settled ? "Settled" : "Pending",  color: txn.settled ? C.green : C.orange, bold: true },
    ]

    xCursor = MARGIN
    values.forEach((v, ci) => {
      text(v.t, xCursor + 6, rowY + 7, 8, v.color, v.bold)
      xCursor += cols[ci].width
    })
  })

  if (transactions.length > maxRows) {
    const noteY = y - rowH * (maxRows + 1) - 6
    text(
      `+ ${transactions.length - maxRows} more transactions not shown.`,
      MARGIN, noteY, 7, C.gray400,
    )
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const footerY = MARGIN + 14
  hline(footerY + 8, C.gray400)
  text(
    "PakPay — Secure Digital Payments  ·  support@pakpay.pk  ·  System-generated, no signature required.",
    MARGIN, footerY, 7, C.gray400,
  )

  // ── Finalise ──────────────────────────────────────────────────────────────
  const bytes = await doc.save()
  return Buffer.from(bytes)
}