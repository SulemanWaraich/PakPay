"use client";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "#" },
    { name: "Features", href: "#features" },
    { name: "Why PakPay", href: "#why-pakpay" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Contact", href: "#contact" },
  ];

  const isLandingPage = pathname === "/" || pathname.startsWith("/landing");


  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border ">
      <div className="container-max section-padding">
        <div className="flex items-center justify-between h-16 lg:h-20 px-4">
          {/* Logo */}
          <a href="/" className="flex items-center justify-center text-center gap-2">
           
            <span className="sm:text-3xl text-2xl  font-bold text-green-600 mt-2">PakPay</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">

            {!session
              ? navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                  >
                    {link.name}
                  </a>
                ))
              : null /* Authenticated users may not need full landing links */}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
          {!session ? (
              <>
                <Link href="/api/auth/signin">
                  <p className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Log In
                  </p>
                </Link>
                <Link href="/api/selector">
                  <Button variant="outline" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="pakpay-outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Logout
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
             {!session
                ? navLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.name}
                    </a>
                  ))
                : null}

              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                {!session ? (
                  <>
                    <Link href="/api/auth/signin">
                      <p className="text-sm font-medium text-muted-foreground hover:text-foreground">
                        Log In
                      </p>
                    </Link>
                    <Link href="/auth/selector">
                      <Button variant="pakpay-outline" size="sm" className="w-fit">
                        Get Started
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard">
                      <Button variant="pakpay-outline" size="sm" className="w-fit">
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="pakpay-outline"
                      size="sm"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      Logout
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
