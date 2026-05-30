/** All wallet / ledger amounts in the database are stored in paisa (1 PKR = 100 paisa). */

export const PAISA_PER_PKR = 100;

export function pkrToPaisa(pkr: number): number {
  if (!Number.isFinite(pkr)) {
    throw new Error("Invalid PKR amount");
  }
  return Math.round(pkr * PAISA_PER_PKR);
}

export function paisaToPkr(paisa: number): number {
  return paisa / PAISA_PER_PKR;
}

/** Format paisa for UI labels (2 decimal PKR). */
export function formatPkrFromPaisa(paisa: number): string {
  return paisaToPkr(paisa).toLocaleString("ur-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** API boundary: expose `amount` fields as PKR without changing object shape. */
export function withAmountInPkr<T extends { amount: number }>(record: T): T {
  return { ...record, amount: paisaToPkr(record.amount) };
}

export function mapAmountsToPkr<T extends { amount: number }>(records: T[]): T[] {
  return records.map(withAmountInPkr);
}
