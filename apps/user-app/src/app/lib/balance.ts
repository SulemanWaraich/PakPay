/** Gross wallet total in paisa (includes funds reserved in `locked`). */
export function totalBalancePaisa(amount: number, locked: number): number {
  return amount;
}

/** Spendable balance in paisa: gross minus in-flight locks. */
export function availableBalancePaisa(amount: number, locked: number): number {
  return Math.max(0, amount - locked);
}
