import { Button } from "../components/ui/button";
import heroIllustration from "../../public/hero-illustration.png";
import Image from "next/image";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative overflow-hidden  bg-pakpay-green-mint">
      <div className="container-max section-padding py-12 lg:py-20 px-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-6 lg:space-y-8 order-2 lg:order-1">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight animate-fade-in">
              Smart Payments for{" "}
              <span className="text-pakpay-green">Modern Pakistan</span>
            </h1>
            <p 
              className="text-lg text-muted-foreground max-w-lg animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              Send, save, and spend with confidence. Fast, secure, and simplified digital transactions for everyone.
            </p>
            <div 
              className="animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <Link href="/api/selector">
              <Button variant="outline" size="lg">
                Get Started
              </Button>
              </Link>
            </div>
          </div>

          {/* Illustration */}
          <div 
            className="relative order-1 lg:order-2 flex justify-center lg:justify-end animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="relative">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-pakpay-green-light rounded-full blur-3xl opacity-60 scale-75"></div>
              
              <Image
                src={heroIllustration}
                alt="Person using PakPay mobile app for transactions"
                className="relative z-10 w-full max-w-md lg:max-w-lg animate-float"
              />
              
              {/* Floating transaction success card */}
              <div className="absolute bottom-8 -left-4 lg:bottom-16 lg:-left-8 bg-card rounded-xl shadow-lg p-4 flex items-center gap-3 animate-fade-in z-20" style={{ animationDelay: "0.5s" }}>
                <div className="w-10 h-10 bg-pakpay-green-light rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-pakpay-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transaction</p>
                  <p className="text-sm font-semibold text-foreground">Success!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
