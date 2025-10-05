export type BankKey = "HBL" | "UBL" | "MEEZAN"

export type BankTheme = {
  key: BankKey
  displayName: string
  // Keep palette within 3-5 colors
  primary: string
  primaryText: string
  surface: string
  surfaceText: string
  accent?: string
  logoAlt: string
}

export const bankThemes: Record<BankKey, BankTheme> = {
  HBL: {
    key: "HBL",
    displayName: "HBL (Habib Bank Limited)",
    primary: "#006747", // HBL green
    primaryText: "#FFFFFF",
    surface: "#F7FAF9",
    surfaceText: "#0F172A",
    accent: "#2DD4BF",
    logoAlt: "HBL logo",
  },
  UBL: {
    key: "UBL",
    displayName: "UBL (United Bank Limited)",
    primary: "#0033A0", // UBL blue
    primaryText: "#FFFFFF",
    surface: "#F8FAFF",
    surfaceText: "#0F172A",
    accent: "#60A5FA",
    logoAlt: "UBL logo",
  },
  MEEZAN: {
    key: "MEEZAN",
    displayName: "Meezan Bank",
    primary: "#7A003C", // Meezan maroon
    primaryText: "#FFFFFF",
    surface: "#FFF8F9",
    surfaceText: "#0F172A",
    accent: "#C7A008", // gold
    logoAlt: "Meezan logo",
  },
}
