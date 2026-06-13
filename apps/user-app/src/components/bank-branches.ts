import { type BankKey, bankThemes } from "./bank-themes";

const BRANCHES_BY_BANK: Record<BankKey, string[]> = {
  HBL: [
    "Karachi Main",
    "Lahore Main",
    "Islamabad Blue Area",
    "Clifton",
    "DHA Karachi",
    "Gulberg Lahore",
  ],
  MEEZAN: [
    "Karachi Main",
    "Lahore Main",
    "DHA Karachi",
    "Gulberg Lahore",
    "Islamabad F-7",
  ],
  UBL: [
    "Karachi Main",
    "Lahore Main",
    "Islamabad Main",
    "Clifton",
    "DHA Karachi",
  ],
};

const DEFAULT_BRANCHES = ["Main Branch", "City Branch", "Online/Digital"];

export function branchesForBank(bankKey: BankKey | ""): string[] {
  if (!bankKey) return DEFAULT_BRANCHES;
  return BRANCHES_BY_BANK[bankKey] ?? DEFAULT_BRANCHES;
}

export function branchesForBankName(bankName: string): string[] {
  const entry = Object.entries(bankThemes).find(
    ([, theme]) => theme.displayName === bankName,
  );
  if (!entry) return DEFAULT_BRANCHES;
  return branchesForBank(entry[0] as BankKey);
}
