import { Button } from "../components/ui/button";
import { Check } from "lucide-react";
import whyChooseIllustration from "../../public/why-choose-illustration.png";
import Image from "next/image";

const benefits = [
  "Lowest Transaction Fees",
  "24/7 Customer Support",
  "Nationwide Acceptance Network",
  "Seamless Integration",
];

const WhyChoose = () => {
  return (
    <section id="why-pakpay" className="py-16 lg:py-24 bg-pakpay-green-mint">
      <div className="container-max section-padding">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <span className="text-pakpay-green text-sm font-medium mb-2 block">
            Why PakPay
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Why Choose PakPay?
          </h2>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Illustration */}
          <div className="relative flex justify-center animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-pakpay-green-light rounded-full blur-2xl opacity-40 scale-90"></div>
              <Image
                src={whyChooseIllustration}
                alt="Two people using PakPay for mobile payments"
                className="relative z-10 w-full max-w-md lg:max-w-lg"
              />
              
              {/* Floating checkmark */}
              <div className="absolute top-4 right-0 lg:top-8 lg:right-4 w-10 h-10 bg-pakpay-green rounded-full flex items-center justify-center shadow-lg animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <Check className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Benefits List */}
          <div className="space-y-5 lg:space-y-6">
            {benefits.map((benefit, index) => (
              <div
                key={benefit}
                className="flex items-center gap-4 animate-slide-in-right"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-6 h-6 bg-pakpay-green rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-medium text-foreground">
                  {benefit}
                </span>
              </div>
            ))}
            
            <div 
              className="pt-4 animate-slide-in-right"
              style={{ animationDelay: "0.4s" }}
            >
              <Button variant="pakpay" size="lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
