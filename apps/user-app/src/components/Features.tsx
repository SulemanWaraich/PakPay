import { ArrowRightLeft, Shield, Receipt } from "lucide-react";

const features = [
  {
    icon: ArrowRightLeft,
    title: "Instant Transfers",
    description: "Send money to anyone, anywhere in seconds. No delays, no hidden fees.",
  },
  {
    icon: Shield,
    title: "Secure Vault",
    description: "Bank-level encryption and multi-factor authentication keep your funds safe.",
  },
  {
    icon: Receipt,
    title: "Bill Payments",
    description: "Pay utility bills, mobile top-ups, and more directly from the app.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-16 lg:py-24 bg-background px-10">
      <div className="container-max section-padding">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <span className="text-pakpay-green text-sm font-medium mb-2 block">
            Features
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Simplify Your Finance
          </h2>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-card border border-border rounded-2xl p-6 lg:p-8 hover:shadow-lg hover:border-pakpay-green/30 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 bg-pakpay-green-light rounded-xl flex items-center justify-center mb-5 group-hover:bg-pakpay-green-light transition-colors">
                <feature.icon className="w-7 h-7 text-pakpay-green" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
