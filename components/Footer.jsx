"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Github,
  Linkedin,
  Mail,
  LayoutDashboard,
  FileText,
  Bot,
  PenBox,
  ChevronRight,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { getUserOnboardingStatus } from "@/actions/user";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Footer() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [navigatingHref, setNavigatingHref] = useState(null);

  const go = async (href) => {
    if (navigatingHref) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setNavigatingHref(href);
    try {
      const { isOnboarded } = await getUserOnboardingStatus();
      await router.push(isOnboarded ? href : "/onboarding");
    } catch (err) {
      console.error("Onboarding check failed:", err);
      await router.push(href);
    } finally {
      setNavigatingHref(null);
    }
  };

  return (
    <footer className="relative z-10 border-t border-border bg-background/50 backdrop-blur-sm pt-20 pb-10">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        >
          {/* Brand Section */}
          <motion.div variants={fadeUp} className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Image
                  src="/logo.png"
                  alt="Pathfinder AI Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">
                Pathfinder <span className="text-primary ml-1">AI</span>
              </span>
            </Link>
            <p className="text-muted-foreground dark:text-gray-300 leading-relaxed max-w-xs">
              Elevate your career with AI-powered insights, professional resume tools, and personalized interview preparation.
            </p>
            <div className="flex gap-4">
              {[
                { href: "https://github.com", Icon: Github, label: "GitHub" },
                { href: "https://linkedin.com", Icon: Linkedin, label: "LinkedIn" },
                { href: "mailto:hello@pathfinder.ai", Icon: Mail, label: "Email" },
              ].map(({ href, Icon, label }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground dark:text-gray-300 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={fadeUp} className="flex flex-col gap-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Explore</h3>
            <ul className="grid gap-3">
              {[
                { label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard },
                { label: "Resume Builder", href: "/resume", Icon: FileText },
                { label: "Mock Interviews", href: "/interview", Icon: Bot },
                { label: "AI Cover Letter", href: "/ai-cover-letter", Icon: PenBox },
              ].map(({ label, href, Icon }) => (
                <li key={label}>
                  <button
                    onClick={() => go(href)}
                    disabled={!!navigatingHref}
                    className="group flex items-center gap-2 text-muted-foreground dark:text-gray-300 hover:text-primary transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {navigatingHref === href ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                    )}
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div variants={fadeUp} className="flex flex-col gap-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Platform</h3>
            <ul className="grid gap-3 text-sm">
              <li><Link href="#features" className="text-muted-foreground dark:text-gray-300 hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="#how-it-works" className="text-muted-foreground dark:text-gray-300 hover:text-primary transition-colors">How it Works</Link></li>
              <li><Link href="#stats" className="text-muted-foreground dark:text-gray-300 hover:text-primary transition-colors">Success Stories</Link></li>
              <li><Link href="#question" className="text-muted-foreground dark:text-gray-300 hover:text-primary transition-colors">Help & FAQ</Link></li>
            </ul>
          </motion.div>

          {/* Newsletter */}
          <motion.div variants={fadeUp} className="flex flex-col gap-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Stay Updated</h3>
            <p className="text-sm text-muted-foreground dark:text-gray-300">Subscribe to our newsletter for the latest career tips and AI features.</p>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Enter your email"
                className="rounded-xl border-border bg-background focus:ring-primary/20"
              />
              <Button className="rounded-xl font-semibold group">
                Subscribe
                <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground dark:text-gray-300">
          <p>© {new Date().getFullYear()} Pathfinder AI. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
