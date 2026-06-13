import Link from "next/link"
import Image from 'next/image';

export function Footer2() {
  return (
    <footer className=" pb-4 pt-3  border-t bg-white/80 backdrop-blur-md border-b border-green-100 shadow-sm" id="contact">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-4 mb-2 text-center">

          <div className="space-y-1">
            <Link href="/" className="flex items-center justify-center">
              <Image src="/logo6.png" alt="PakPay" width={120} height={40} className="h-12 w-auto object-contain" />
              <span className="text-2xl font-bold text-foreground">PakPay</span>
            </Link>
            <p className="text-slate-600 leading-relaxed text-pretty">
              Send, save, and spend with confidence. Fast, secure, and simplified transactions for everyone.
            </p>
          </div>

          <div className="mt-3">
            <h4 className="font-bold font-bold text-foreground mb-4">Company</h4>
            <ul className="flex flex-col gap-4">
              <li>
                <Link href="/about" className="text-slate-600 hover:text-green-500 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-slate-600 hover:text-green-500 transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          <div className="mt-3">
            <h4 className="font-bold font-bold text-foreground mb-4">Support</h4>
            <ul className="flex flex-col gap-4">
              <li>
                <Link href="/contact" className="text-slate-600 hover:text-green-500 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-600 hover:text-green-500 transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          <div className="mt-3">
            <h4 className="font-bold text-foreground mb-4">Legal</h4>
            <ul className="flex flex-col gap-4">
              <li>
                <Link href="/terms" className="text-slate-600 hover:text-green-500 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-600 hover:text-green-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="text-center pt-2 mt-2 border-t border-slate-700">
          <p className="text-green-600 text-sm">© 2026 PakPay. All rights reserved.</p>
        </div>

      </div>
    </footer>
  )
}