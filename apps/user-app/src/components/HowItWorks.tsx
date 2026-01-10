import { UserPlus, Wallet, Send } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: "Sign Up in Minutes",
    description: "Download the app and create your account with basic details.",
  },
  {
    number: 2,
    icon: Wallet,
    title: "Add Funds or Link Bank",
    description: "Securely connect your bank account or deposit cash at partner agents.",
  },
  {
    number: 3,
    icon: Send,
    title: "Send, Spend & Save",
    description: "Start using PakPay for all your daily financial needs.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 lg:py-24 bg-background">
      <div className="container-max section-padding">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <span className="text-pakpay-green text-sm font-medium mb-2 block">
            Steps
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            How It Works
          </h2>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="text-center relative animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Icon with number */}
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-pakpay-green-light rounded-2xl flex items-center justify-center mx-auto">
                  <step.icon className="w-10 h-10 text-pakpay-green" />
                </div>
                {/* Number badge */}
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-pakpay-green rounded-full flex items-center justify-center shadow-md">
                  <span className="text-primary-foreground text-sm font-bold">
                    {step.number}
                  </span>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {step.description}
              </p>

              {/* Connector line (hidden on last item and mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px border-t-2 border-dashed border-pakpay-green/30"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
