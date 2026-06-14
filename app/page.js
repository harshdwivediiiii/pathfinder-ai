"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, ChevronRight, FileText, Target, Star, CheckCircle, TrendingUp, BarChart2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import HeroStats from "@/components/HeroStats";
import { GlobalScrollTracker } from "@/components/GlobalScrollTracker";
import { ScrollStory } from "@/components/sections/ScrollStory";

import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { CTASection } from "@/components/sections/CTASection";
import { OpenSourceCommunity } from "@/components/sections/OpenSourceCommunity";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { TiltCard } from "@/components/motion/tilt-card";
import { features } from "@/data/features";
import { howItWorks } from "@/data/howItWorks";
import { faqs } from "@/data/faqs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ScrollToTop from "@/components/ui/Scrolltotop";

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.12], [1, 0.95]);

  const handleDashboard = () => {
    router.push(isSignedIn ? "/dashboard" : "/sign-in");
  };

  return (
    <div className="relative overflow-hidden">
      <GlobalScrollTracker />
      
      {/* ------------- HERO SECTION ------------- */}
      <section id="hero" className="relative min-h-[100vh] flex flex-col justify-center pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-primary/5 rounded-full blur-[180px]" />
          <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px]" />
        </div>

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="w-full">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left Column */}
              <div className="space-y-10">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 shadow-sm"
                >
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-foreground/80 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                    AI-Powered Career Platform
                  </span>
                </motion.div>

                <div className="space-y-6">
                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] text-foreground"
                  >
                    Your Career,
                    <br />
                    <span className="text-gradient-primary">Amplified by AI.</span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg"
                  >
                    From resume optimization to interview mastery, PathFinder AI gives you the tools to accelerate your career with artificial intelligence.
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col sm:flex-row items-start gap-4"
                >
                  <MagneticButton asChild>
                    <Button
                      size="lg"
                      onClick={handleDashboard}
                      className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 font-bold group text-base"
                    >
                      Launch Your Career
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </MagneticButton>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="h-14 px-8 rounded-2xl glass hover:bg-muted/50 border-border/50 transition-all duration-300 font-bold group text-base"
                  >
                    Explore Features
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-6 text-xs text-muted-foreground"
                >
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full border-2 border-background bg-muted/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <span>Trusted by 10,000+ professionals</span>
                </motion.div>
              </div>

              {/* Right Column - Interactive Dashboard Preview */}
              <div className="relative w-full h-[500px] lg:h-[600px] mt-8 lg:mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 w-full h-full flex items-center justify-center"
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

                  {/* Dashboard Container */}
                  <div className="relative w-full max-w-[600px] h-full max-h-[550px] rounded-2xl border border-white/10 bg-background/40 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col">
                    {/* Mac-style Header */}
                    <div className="h-12 border-b border-white/10 bg-white/5 flex items-center px-4 gap-4 shrink-0">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="h-6 w-48 bg-white/5 rounded-md flex items-center px-3 gap-2">
                          <Activity className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-medium">pathfinder.ai / dashboard</span>
                        </div>
                      </div>
                    </div>

                    {/* Dashboard Grid */}
                    <div className="flex-1 p-4 sm:p-6 flex flex-col gap-4 overflow-hidden">
                      {/* Top Row: Resume & ATS */}
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
                          className="p-4 rounded-xl border border-white/5 bg-white/5 shadow-inner"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                              <FileText className="h-4 w-4" />
                            </div>
                            <span className="text-2xl font-black text-foreground tracking-tight">94<span className="text-sm text-muted-foreground">%</span></span>
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Resume Score</p>
                          <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                            <motion.div className="h-full rounded-full bg-emerald-500" initial={{ width: "0%" }} animate={{ width: "94%" }} transition={{ duration: 1.5, delay: 1 }} />
                          </div>
                        </motion.div>

                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}
                          className="p-4 rounded-xl border border-white/5 bg-white/5 shadow-inner"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                            <span className="text-2xl font-black text-foreground tracking-tight">88<span className="text-sm text-muted-foreground">%</span></span>
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">ATS Match</p>
                          <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                            <motion.div className="h-full rounded-full bg-blue-500" initial={{ width: "0%" }} animate={{ width: "88%" }} transition={{ duration: 1.5, delay: 1.1 }} />
                          </div>
                        </motion.div>
                      </div>

                      {/* Middle Row: Readiness, Gap, Match */}
                      <div className="grid grid-cols-3 gap-3 sm:gap-4">
                        {[
                          { title: "Readiness", val: "High", icon: Target, color: "text-purple-500", bg: "bg-purple-500/20", delay: 0.8 },
                          { title: "Skill Gap", val: "Minor", icon: BarChart2, color: "text-amber-500", bg: "bg-amber-500/20", delay: 0.9 },
                          { title: "Job Match", val: "95%", icon: Star, color: "text-orange-500", bg: "bg-orange-500/20", delay: 1.0 },
                        ].map((item, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: item.delay, duration: 0.5 }}
                            className="p-3 sm:p-4 rounded-xl border border-white/5 bg-white/5 shadow-inner flex flex-col items-center text-center justify-center"
                          >
                            <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center ${item.color} mb-2`}>
                              <item.icon className="h-4 w-4" />
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-foreground">{item.val}</p>
                            <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5 hidden sm:block">{item.title}</p>
                          </motion.div>
                        ))}
                      </div>

                      {/* Bottom Row: Career Chart */}
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.5 }}
                        className="flex-1 min-h-[120px] rounded-xl border border-white/5 bg-white/5 shadow-inner p-4 flex flex-col relative overflow-hidden"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Career Progress</p>
                          </div>
                          <span className="text-xs font-bold text-primary">+24% MoM</span>
                        </div>
                        
                        {/* Mock Chart Area */}
                        <div className="flex-1 flex items-end gap-2 sm:gap-3 px-2 pt-4">
                          {[30, 45, 35, 60, 50, 75, 90, 100].map((height, i) => (
                            <div key={i} className="flex-1 bg-primary/10 rounded-t-sm relative group h-full flex items-end">
                              <motion.div 
                                className="w-full bg-gradient-to-t from-primary/40 to-primary rounded-t-sm"
                                initial={{ height: "0%" }}
                                animate={{ height: `${height}%` }}
                                transition={{ duration: 1, delay: 1.2 + (i * 0.1), ease: "easeOut" }}
                              />
                            </div>
                          ))}
                        </div>
                      </motion.div>

                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ------------- SCROLL STORY ------------- */}
      <ScrollStory />

      {/* ------------- FEATURES SECTION ------------- */}
      <section id="features" className="relative py-8 md:py-12 scroll-mt-20">
        <div className="container mx-auto px-4 md:px-6">
          <FadeUp className="max-w-3xl mx-auto text-center mb-20 space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-3 w-3" />
              Features
            </span>
            <h2 className="text-3xl md:text-6xl font-bold tracking-tight text-foreground">
              Built for the{" "}
              <span className="text-gradient-primary">Modern Professional</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience a suite of AI tools meticulously designed to accelerate your career growth.
            </p>
          </FadeUp>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <StaggerItem key={f.title}>
                  <TiltCard tiltDegree={6} className="group relative h-full">
                    <div className="relative h-full p-8 rounded-2xl glass border border-border/40 hover:border-primary/30 transition-all duration-500 overflow-hidden">
                      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/8 rounded-full blur-3xl group-hover:bg-primary/15 transition-all duration-500 pointer-events-none" />
                      <div className="relative z-10 space-y-5">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-lg font-bold tracking-tight text-foreground">{f.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                        </div>
                        <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Explore <ChevronRight className="ml-1 h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* The individual feature sections (Roadmap, Resume, Interview, SkillGap) have been unified into the ScrollStory component above. */}

      {/* ------------- STATS SECTION ------------- */}
      <section className="relative py-8 md:py-12 bg-muted/30 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <FadeUp>
            <HeroStats />
          </FadeUp>
        </div>
      </section>

      {/* ------------- HOW IT WORKS ------------- */}
      <section id="how-it-works" className="relative py-8 md:py-12 scroll-mt-20">
        <div className="container mx-auto px-4 md:px-6">
          <FadeUp className="max-w-3xl mx-auto text-center mb-20 space-y-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-widest text-primary">
              Process
            </span>
            <h2 className="text-3xl md:text-6xl font-bold tracking-tight text-foreground">
              Four Steps to{" "}
              <span className="text-gradient-primary">Success</span>
            </h2>
          </FadeUp>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto relative">
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 -z-10" />
            {howItWorks.map((step, i) => (
              <StaggerItem key={step.title}>
                <TiltCard tiltDegree={4} className="flex flex-col items-center text-center space-y-5">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-background border border-border/50 flex items-center justify-center shadow-lg">
                      <div className="text-primary">{step.icon}</div>
                    </div>
                    <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg border-2 border-background">
                      {i + 1}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-base font-bold tracking-tight text-foreground">{step.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px]">{step.description}</p>
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ------------- TESTIMONIALS ------------- */}
      <TestimonialsSection />

      {/* ------------- PRICING ------------- */}
      <PricingSection />

      {/* ------------- FAQ ------------- */}
      <section id="question" className="relative py-8 md:py-12 scroll-mt-20">
        <div className="container mx-auto px-4 md:px-6">
          <FadeUp className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">Got Questions?</h2>
            <p className="text-muted-foreground">Everything you need to know about PathFinder AI</p>
          </FadeUp>

          <FadeUp delay={0.2} className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={faq.question}
                  value={`item-${index}`}
                  className="border border-border/50 rounded-2xl px-6 glass hover:border-primary/30 transition-all"
                >
                  <AccordionTrigger className="text-left font-bold py-5 hover:text-primary transition-colors text-sm">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed text-sm">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeUp>
        </div>
      </section>

      {/* ------------- CTA ------------- */}
      <CTASection />

      <OpenSourceCommunity />

      <ScrollToTop />
    </div>
  );
}
