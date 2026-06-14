"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";

const plans = [
  {
    name: "Starter",
    price: "Free",
    desc: "Get started with basic career tools",
    features: [
      "AI Resume Builder (Basic)",
      "1 Cover Letter / month",
      "5 Mock Interview Questions",
      "Basic ATS Score",
      "Email Support",
    ],
    cta: "Get Started",
    href: "/sign-up",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    desc: "For serious career advancement",
    features: [
      "Unlimited Resumes & Cover Letters",
      "Unlimited Mock Interviews",
      "Advanced ATS Analysis",
      "Industry Insights & Salary Data",
      "Interview Performance Analytics",
      "Priority Support",
    ],
    cta: "Start Free Trial",
    href: "/sign-up",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$49",
    period: "/month",
    desc: "For teams and organizations",
    features: [
      "Everything in Pro",
      "Team Dashboard",
      "Custom Templates",
      "API Access",
      "Dedicated Account Manager",
      "Custom Integrations",
    ],
    cta: "Contact Sales",
    href: "/sign-up",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="relative py-32 md:py-48 bg-muted/30 overflow-hidden"
    >
      <div className="container mx-auto px-4 md:px-6">
        <FadeUp className="max-w-3xl mx-auto text-center mb-20 space-y-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" />
            Pricing
          </span>
          <h2 className="text-3xl md:text-6xl font-bold tracking-tight text-foreground">
            Simple, Transparent{" "}
            <span className="text-gradient-primary">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your career goals. Upgrade anytime.
          </p>
        </FadeUp>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <motion.div
                whileHover={{ y: -4 }}
                className={`relative h-full rounded-2xl border p-8 transition-all duration-500 ${plan.popular
                    ? "border-primary/40 bg-primary/[0.03] shadow-xl shadow-primary/5"
                    : "border-border/40 glass hover:border-primary/30"
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {plan.name}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-foreground">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-sm text-muted-foreground">
                          {plan.period}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {plan.desc}
                    </p>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.href} className="block">
                    <Button
                      className={`w-full h-12 rounded-xl font-bold ${
                        plan.popular
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:text-primary-foreground"
                          : "border border-border bg-card text-white hover:bg-primary hover:text-primary-foreground"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>

                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
