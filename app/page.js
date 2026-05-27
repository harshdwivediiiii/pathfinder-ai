"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import {
  ArrowRight,
  Trophy,
  Target,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { features } from "@/data/features";
import { testimonial } from "@/data/testimonial";
import { faqs } from "@/data/faqs";
import { howItWorks } from "@/data/howItWorks";

import { useTheme } from "next-themes";
import InteractiveBackground from "@/components/Background";
import HeroSection from "@/components/Herosection";
import HeroStats from "@/components/HeroStats";
import ScrollToTop from "@/components/ui/Scrolltotop";


/* ────────────────────────────────────────────────────────────────── */
/* Helper animation configs                                           */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
  viewport: { once: true },
});



/* ────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const { resolvedTheme } = useTheme();
const isDarkMode = resolvedTheme === "dark";

  return (
    <>

    <InteractiveBackground isDarkMode={isDarkMode} />
      {/* Decorative grid bg */}
      <div className="grid-background" />

      {/* ───────────────  HERO  ─────────────── */}
      <HeroSection />

      {/* ─────────────  FEATURES  ───────────── */}
 <section id="features" className="w-full py-12 md:py-24 lg:py-32 scroll-mt-20">
  <div className="container mx-auto px-4 md:px-6">
    <motion.h2
      {...fadeUp()}
      className="mb-12 text-center text-3xl font-bold tracking-tighter md:text-4xl"
    >
      Powerful Features for Your{" "}
      <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
        Career Growth
      </span>
    </motion.h2>

    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
      {features.map((f, i) => {
        const Icon = f.icon;
        return (
          <motion.div
            key={f.title}
            {...fadeUp(i * 0.1)}
            whileHover={{ scale: 1.03, y: -5 }}
            className="h-full group"
          >
            <Card
              className={`h-full min-h-[320px] border-2 border-border transition-all duration-300 ${f.borderHover} hover:shadow-2xl ${f.shadowHover} bg-card relative overflow-hidden`}
            >
              {/* Gradient overlay on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
              />

              <CardContent className="flex h-full flex-col items-center gap-4 pt-8 text-center relative z-10">
                {/* Icon with colored background */}
                <div
                  className={`mb-2 p-4 rounded-2xl ${f.bgLight} ${f.bgDark} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
                >
                  <Icon className={`w-10 h-10 ${f.textColor}`} />
                </div>

                <h3 className="text-xl font-bold leading-snug">
                  {f.title}
                </h3>

                <p className="text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  </div>
</section>

      {/* ───────────────  STATS  ────────────── */}
      <section id="stats" className="w-full  py-12 md:py-24 scroll-mt-20">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div {...fadeUp()}>
            <HeroStats />
          </motion.div>
        </div>
      </section>

      {/* ────────────  HOW‑IT‑WORKS  ────────── */}
      <section id="how-it-works" className="w-full py-12 md:py-24 scroll-mt-20">
  <div className="container mx-auto px-4 md:px-6">
    <motion.div
      {...fadeUp()}
      className="mx-auto mb-16 max-w-3xl text-center"
    >
      <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
        How It{" "}
        <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
          Works
        </span>
      </h2>
      <p className="text-muted-foreground text-lg">
        Four simple steps to accelerate your career growth
      </p>
    </motion.div>

    <div className="mx-auto max-w-6xl relative">
      {/* Connecting dotted line - desktop only */}
      <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 z-0">
        <div className="w-full h-full border-t-2 border-dashed border-purple-500/30" />
      </div>

      <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 z-10">
        {howItWorks.map((step, i) => {
          const stepColors = [
            {
              bg: "bg-purple-100 dark:bg-purple-500/10",
              text: "text-purple-600 dark:text-purple-400",
              border: "border-purple-500/30",
              shadow: "hover:shadow-purple-500/30",
            },
            {
              bg: "bg-blue-100 dark:bg-blue-500/10",
              text: "text-blue-600 dark:text-blue-400",
              border: "border-blue-500/30",
              shadow: "hover:shadow-blue-500/30",
            },
            {
              bg: "bg-green-100 dark:bg-green-500/10",
              text: "text-green-600 dark:text-green-400",
              border: "border-green-500/30",
              shadow: "hover:shadow-green-500/30",
            },
            {
              bg: "bg-orange-100 dark:bg-orange-500/10",
              text: "text-orange-600 dark:text-orange-400",
              border: "border-orange-500/30",
              shadow: "hover:shadow-orange-500/30",
            },
          ];
          const color = stepColors[i % 4];

          return (
            <motion.div
              key={step.title}
              {...fadeUp(i * 0.15)}
              whileHover={{ y: -8 }}
              className="group flex flex-col items-center space-y-4 text-center relative"
            >
              {/* Step number badge */}
              <div className="absolute -top-3 -right-3 md:relative md:top-0 md:right-0 md:mb-2 z-20">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full bg-background border-2 ${color.border} ${color.text} text-sm font-bold shadow-md`}
                >
                  {i + 1}
                </div>
              </div>

              {/* Icon circle */}
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-2xl ${color.bg} transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-2xl ${color.shadow} relative z-10`}
              >
                <div className={color.text}>{step.icon}</div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold">{step.title}</h3>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed px-2">
                {step.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  </div>
</section>

      {/* ─────────────  TESTIMONIALS  ───────────── */}
      <section id = "feedback" className="w-full  py-12 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <motion.h2
            {...fadeUp()}
            className="mb-12 text-center text-3xl font-bold"
          >
            What Our Users Say
          </motion.h2>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
            {testimonial.map((t, i) => (
              <motion.div key={i} {...fadeUp(i * 0.1)}>
                <Card className="bg-background">
                  <CardContent className="pt-6">
                    <div className="flex flex-col space-y-4">
                      <div className="mb-4 flex items-center space-x-4">
                        <Image
                          src={t.image}
                          alt={t.author}
                          width={40}
                          height={40}
                          className="h-12 w-12 rounded-full border-2 border-primary/20 object-cover"
                        />
                        <div>
                          <p className="font-semibold">{t.author}</p>
                          <p className="text-sm text-muted-foreground">
                            {t.role}
                          </p>
                          <p className="text-sm text-primary">{t.company}</p>
                        </div>
                      </div>
                      <blockquote className="relative italic text-muted-foreground">
                        <span className="absolute -top-4 -left-2 text-3xl text-primary">
                          &ldquo;
                        </span>
                        {t.quote}
                        <span className="absolute -bottom-4 text-3xl text-primary">
                          &rdquo;
                        </span>
                      </blockquote>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────  FAQ  ─────────────── */}
      <section id = "question" className="w-full py-12 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            {...fadeUp()}
            className="mx-auto mb-12 max-w-3xl text-center"
          >
            {/* Animated headline using react‑type‑animation */}
            <h2 className="mb-4 text-3xl font-bold">
              <TypeAnimation
                sequence={[
                  "Frequently Asked Questions",
                  2500,
                  "Need an answer? 🤔",
                  2500,
                ]}
                speed={50}
                wrapper="span"
                repeat={Infinity}
              />
            </h2>
            <p className="text-muted-foreground">
              Find answers to common questions about our platform
            </p>
          </motion.div>

          <motion.div
            {...fadeUp(0.2)}
            className="mx-auto max-w-3xl"
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ───────────────  CTA  ─────────────── */}
      <section id = "contact" className="w-full">
        <motion.div
          {...fadeUp()}
          className="gradient mx-auto rounded-lg py-24"
        >
          <div className="mx-auto flex max-w-3xl flex-col items-center space-y-4 text-center text-black dark:text-white">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-black dark:text-white">
              Ready to Accelerate Your Career?
            </h2>
            <p className="mx-auto max-w-[600px]  md:text-xl text-black dark:text-white">
              Join thousands of professionals who are advancing their careers
              with AI‑powered guidance.
            </p>
            <Link href="/dashboard" passHref>
              <Button
                size="lg"
                variant="secondary"
                className="mt-5 h-11 animate-bounce bg-black text-white dark:bg-white dark:text-black dark:hover:bg-white/80"
              >
                Start Your Journey Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ───────────────  Scroll To Top  ─────────────── */}
      <ScrollToTop />
    </>
  );
}