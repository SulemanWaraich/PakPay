import Link from "next/link"
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react"
import Image from 'next/image';


export function Footer() {
  return (
    <footer className="bg-white pt-14 pb-4 border-t bg-pakpay-green-mint" id="contact">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-4 mb-6 text-center">

          <div className=" space-y-1">
            <Link href="/" className="flex items-center justify-center ">

              <Image src="/logo6.png" alt="PakPay" width={120} height={40} className="h-12 w-auto object-contain" />

              <span className="text-2xl font-bold text-brand-dark">PakPay</span>
            </Link>
            <p className="text-gray-600 leading-relaxed text-pretty">
              Send, save, and spend with confidence. Fast, secure, and simplified transactions for everyone.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-brand-dark mb-6">Company</h4>
            <ul className="flex flex-col gap-4">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-green-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-600 hover:text-green-600 transition-colors">
                  Careers
                </Link>
              </li>
             
              {/* <li>
                <Link href="#" className="text-gray-600 hover:text-green-600 transition-colors">
                  Blog
                </Link>
              </li> */}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-brand-dark mb-6">Support</h4>
            <ul className="flex flex-col gap-4">
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-green-600 transition-colors">
                  Help Center
                </Link>
              </li>
              {/* <li>
                <Link href="#" className="text-gray-600 hover:text-green-600 transition-colors">
                  FAQs
                </Link>
              </li> */}
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-green-600 transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-brand-dark mb-6">Legal</h4>
            <ul className="flex flex-col gap-4">
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-green-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-green-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
            <div className="flex items-center justify-center  gap-4 mt-8">
              <Link
                href="#"
                className="w-8 h-8 rounded-full bg-brand-green/10 flex bg-pakpay-green-light items-center justify-center text-brand-green hover:bg-brand-green hover:text-white transition-all"
              >
                <Facebook className="w-4 h-4 text-pakpay-green group-hover:text-primary-foreground transition-colors" />
              </Link>
              <Link
                href="#"
                className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green hover:bg-brand-green hover:text-white transition-all"
              >
                <Twitter className="w-4 h-4 text-pakpay-green group-hover:text-primary-foreground transition-colors" />
              </Link>
              <Link
                href="#"
                className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green hover:bg-brand-green hover:text-white transition-all"
              >
                <Linkedin className="w-4 h-4 text-pakpay-green group-hover:text-primary-foreground transition-colors" />
              </Link>
              <Link
                href="#"
                className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green hover:bg-brand-green hover:text-white transition-all"
              >
                <Instagram className="w-4 h-4 text-pakpay-green group-hover:text-primary-foreground transition-colors" />
              </Link>
            </div>
          </div>
        </div>
        {/* <div className="text-center pt-10 border-t border-gray-200">
          <p className="text-gray-800 text-sm ">© 2026 PakPay. All rights reserved.</p>
        </div> */}
      </div>
    </footer>
  )
}
