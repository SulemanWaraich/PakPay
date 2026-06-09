import type { Metadata } from "next";
import CareersClient from "./CareersClient";

export const metadata: Metadata = {
  title: "Careers at PakPay",
  description: "Join PakPay — building the future of payments in Pakistan. Internship & graduate roles opening soon.",
  openGraph: {
    title: "Careers at PakPay",
    description: "Join PakPay — building the future of payments in Pakistan.",
  },
};

export default function Page() {
  return <CareersClient />;
}