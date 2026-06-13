"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Github, Linkedin, Mail, LayoutDashboard, FileText, Bot, PenBox, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function Footer() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const go = async (href) => {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    try {
      const { getUserOnboardingStatus } = await import("@/actions/user");
      const { isOnboarded } = await getUserOnboardingStatus();
      router.push(isOnboarded ? href : "/onboarding");
    } catch {
      router.push(href);
    }
  };

  return (
    <footer className="relative z-10 border-t border-border/50 pt-20 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 lg:gap-8 mb-16"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          <motion.div variants={fadeUp} className="col-span-2 md:col-span-2 lg:col-span-2 flex flex-col gap-5">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all ring-1 ring-primary/10 group-hover:ring-primary/30">
                <Image
                  src="/logo.png"
                  alt="Pathfinder AI Logo"
                  width={32}
                  height={32}
                  className="h-7 w-7 object-contain transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Pathfinder <span className="text-primary">AI</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Elevate your career with AI-powered insights, professional resume tools, and personalized interview preparation.
            </p>
            <div className="flex gap-3">
              {[
                { href: "https://github.com", Icon: Github, label: "GitHub" },
                { href: "https://linkedin.com", Icon: Linkedin, label: "LinkedIn" },
                { href: "mailto:hello@pathfinder.ai", Icon: Mail, label: "Email" },
              ].map(({ href, Icon, label }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col gap-5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Product</h3>
            <ul className="space-y-3">
              {[
                { label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard },
                { label: "Resume Builder", href: "/resume", Icon: FileText },
                { label: "Mock Interviews", href: "/interview", Icon: Bot },
                { label: "AI Cover Letter", href: "/ai-cover-letter", Icon: PenBox },
              ].map(({ label, href, Icon }) => (
                <li key={label}>
                  <button
                    onClick={() => go(href)}
                    className="group flex items-center gap-2 text-sm text-muted-foreground/80 hover:text-primary transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col gap-5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Platform</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="#features" className="text-muted-foreground/80 hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="#how-it-works" className="text-muted-foreground/80 hover:text-primary transition-colors">How it Works</Link></li>
              <li><Link href="#stats" className="text-muted-foreground/80 hover:text-primary transition-colors">Success Stories</Link></li>
               <li><Link href="/help" className="text-muted-foreground/80 hover:text-primary transition-colors">Help</Link></li>
              <li><Link href="#question" className="text-muted-foreground/80 hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col gap-5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy-policy" className="text-muted-foreground/80 hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-muted-foreground/80 hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="text-muted-foreground/80 hover:text-primary transition-colors">Cookies</Link></li>
            </ul>
          </motion.div>
        </motion.div>

        <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground/60">
          <p>&copy; {new Date().getFullYear()} Pathfinder AI. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
