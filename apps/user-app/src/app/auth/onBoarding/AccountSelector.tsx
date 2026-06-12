"use client"

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Store, Check, ArrowRight } from 'lucide-react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type AccountType = 'USER' | 'MERCHANT' | null;

const personalFeatures = [
  'Send & receive money instantly',
  'Debit card with cashback',
  'Budgeting & analytics',
];

const merchantFeatures = [
  'Accept payments globally',
  'Invoicing & payouts',
  'Multi-currency accounts',
];

function SelectorCard({
  selected,
  onSelect,
  icon: Icon,
  title,
  description,
  features,
  isPopular,
  delay,
  disabled,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ElementType;
  title: string;
  description: string;
  features: string[];
  isPopular: boolean;
  delay: number;
  disabled: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      onClick={!disabled ? onSelect : undefined}
      className={`
        relative rounded-2xl border bg-white p-10 transition-shadow
        ${isPopular ? 'mt-3' : ''}
        ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        ${
          selected
            ? 'border-l-[4px] border-l-[#00C853] border-[#00C853] shadow-md ring-2 ring-[#00C853] ring-offset-2'
            : 'border-[#E2EBE6] hover:border-[#00C853] hover:shadow-md'
        }
      `}
      style={
        selected
          ? { background: 'radial-gradient(circle at 50% 0%, rgba(0,200,83,0.06) 0%, #FFFFFF 70%)' }
          : undefined
      }
    >
      {/* Most Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-[#00C853] text-white text-xs font-semibold rounded-full px-3 py-1 whitespace-nowrap">
            Most Popular
          </span>
        </div>
      )}

      {/* Selection Checkmark */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="checkmark"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#00C853] flex items-center justify-center"
          >
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-[#E8FDF0] flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-[#00C853]" />
      </div>

      <h3 className="text-xl font-semibold text-[#111827] mb-2">{title}</h3>
      <p className="text-[15px] text-[#6B7280] mb-6">{description}</p>

      {/* Feature List */}
      <div className="border-t border-[#E2EBE6] pt-6 space-y-4">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#E8FDF0] flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-[#00C853]" strokeWidth={3} />
            </div>
            <span className="text-[15px] text-[#374151]">{feature}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function AccountSelector() {
  const [selected, setSelected] = useState<AccountType>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const { data: session, update } = useSession();
  const router = useRouter();

  async function handleRoleSelect(role: "USER" | "MERCHANT") {
    if (session?.user) {
      setLoading(role);
      const res = await fetch("/api/user/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        await update({ role });
        window.location.href =
          role === "MERCHANT" ? "/merchant/dashboard" : "/user/dashboard";
      } else {
        setLoading(null);
        alert("Something went wrong. Please try again.");
      }
      return;
    }

    router.push(`/auth/signup?role=${role}`);
  }

  return (
    <div className="min-h-screen bg-[#F7FAF8]">
      <main className="max-w-4xl mx-auto px-6 pt-16 pb-24">

        {/* Heading */}
        <div className="text-center mb-12">
          <div className="inline-block relative">
            <h1 className="text-3xl md:text-4xl font-bold text-[#111827] leading-tight">
            How will you use PakPay?

            </h1>
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
              className="h-1 bg-[#00C853] rounded-full mt-2"
            />
          </div>
          <p className="mt-4 text-[#6B7280] text-base md:text-lg">
            Pick the account that fits. You can upgrade or switch anytime.
          </p>
        </div>

        {/* Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          <SelectorCard
            selected={selected === 'USER'}
            onSelect={() => setSelected('USER')}
            icon={Wallet}
            title="Personal"
            description="For everyday spending, saving, and sending money to friends."
            features={personalFeatures}
            isPopular={false}
            delay={0}
            disabled={loading !== null}
          />
          <SelectorCard
            selected={selected === 'MERCHANT'}
            onSelect={() => setSelected('MERCHANT')}
            icon={Store}
            title="Merchant"
            description="For businesses that need to accept payments and manage cash flow."
            features={merchantFeatures}
            isPopular={true}
            delay={0.1}
            disabled={loading !== null}
          />
        </div>

        {/* Continue Button + Trust Line */}
        <div className="flex flex-col items-center gap-4">
          <motion.button
            animate={{
              backgroundColor: selected && !loading ? '#00C853' : '#FFFFFF',
              color: selected && !loading ? '#FFFFFF' : '#9CA3AF',
            }}
            transition={{ duration: 0.3 }}
            whileTap={selected && !loading ? { scale: 0.97 } : {}}
            disabled={!selected || loading !== null}
            onClick={() => selected && handleRoleSelect(selected)}
            className={`
              w-full max-w-[480px] rounded-full py-4 text-lg font-semibold
              flex items-center justify-center gap-2 transition-colors
              ${selected && !loading
                ? 'cursor-pointer'
                : 'border border-gray-200 cursor-not-allowed'
              }
            `}
          >
            {loading ? 'Setting up...' : 'Continue'}
            {selected && !loading && <ArrowRight className="w-5 h-5" />}
          </motion.button>

          <p className="text-xs text-[#6B7280] text-center">
            256-bit encryption &middot; No credit check &middot; Setup in 2 minutes
          </p>
        </div>
      </main>

      {/* Full-screen Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"
          >
            <div className="w-12 h-12 border-4 border-green-200 border-t-[#00C853] rounded-full animate-spin mb-4" />
            <p className="text-gray-700 font-medium text-lg">
              Setting up your {loading === "MERCHANT" ? "merchant" : "user"} account...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
