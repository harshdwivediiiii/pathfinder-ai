"use client";

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
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const footerLinks = {
  product: [
    { label: "Dashboard", href: "/dashboard", Icon: LayoutDashboard },
    { label: "Resume Builder", href: "/resume", Icon: FileText },
    { label: "Mock Interviews", href: "/interview", Icon: Bot },
    { label: "AI Cover Letter", href: "/ai-cover-letter", Icon: PenBox },
  ],
  platform: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "/coming-soon" },
    { label: "Help", href: "/help" },
    { label: "FAQ", href: "#question" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Cookies", href: "/cookies" },
  ],
};

const socials = [
  {
    href: "https://github.com/harshdwivediiiii/pathfinder-ai",
    Icon: Github,
    label: "GitHub",
  },
  {
    href: "https://www.linkedin.com/in/harshvardhan-d-86b375290",
    Icon: Linkedin,
    label: "LinkedIn",
  },
  {
    href: "mailto:hello@pathfinder.ai",
    Icon: Mail,
    label: "Email",
  },
];

export default function Footer() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const go = async (href) => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    try {
      const { getUserOnboardingStatus } = await import("@/actions/user");
      const { isOnboarded } = await getUserOnboardingStatus();
      router.push(isOnboarded ? href : "/onboarding");
    } catch {
      router.push(href);
    }
  };

  return (
    <footer className="relative z-10 overflow-hidden">
      {/* Top separator glow line */}
      <div className="relative h-px w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-8 bg-violet-500/10 blur-2xl rounded-full" />
      </div>

      <div className="relative bg-black/60 backdrop-blur-xl">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-violet-600/5 via-transparent to-transparent rounded-full blur-[120px]" />
          <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-blue-600/4 via-transparent to-transparent rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-8">
          {/* Main grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 lg:gap-8 mb-16"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={{
              show: { transition: { staggerChildren: 0.06 } },
            }}
          >
            {/* Brand column */}
            <motion.div
              variants={fadeUp}
              className="col-span-2 md:col-span-2 lg:col-span-2 flex flex-col gap-5"
            >
              <Link href="/" className="flex items-center gap-2.5 group w-fit">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/30 transition-shadow duration-500">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  Pathfinder{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
                    AI
                  </span>
                </span>
              </Link>

              <p className="text-sm text-white/40 leading-relaxed max-w-sm">
                Elevate your career with AI-powered insights, professional
                resume tools, and personalized interview preparation.
              </p>

              {/* Social icons */}
              <div className="flex gap-3">
                {socials.map(({ href, Icon, label }) => (
                  <Link
                    key={label}
                    href={href}
                    target="_blank"
                    className="h-9 w-9 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/10 transition-all duration-300"
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Product column */}
            <motion.div variants={fadeUp} className="flex flex-col gap-5">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">
                Product
              </h3>
              <ul className="space-y-3">
                {footerLinks.product.map(({ label, href, Icon }) => (
  <li key={label}>
    <Link
      href={href}
      onClick={(e) => {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && e.button === 0) {
          e.preventDefault();
          go(href);
        }
      }}
      className="group flex items-center gap-2.5 text-sm text-white/45 hover:text-white/90 transition-colors duration-300"
    >
      <Icon className="h-3.5 w-3.5 text-white/20 group-hover:text-violet-400 transition-colors duration-300" />
      {label}
    </Link>
  </li>
))}
              </ul>
            </motion.div>

            {/* Platform column */}
            <motion.div variants={fadeUp} className="flex flex-col gap-5">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">
                Platform
              </h3>
              <ul className="space-y-3">
                {footerLinks.platform.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-white/45 hover:text-white/90 transition-colors duration-300"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Legal column */}
            <motion.div variants={fadeUp} className="flex flex-col gap-5">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">
                Legal
              </h3>
              <ul className="space-y-3">
                {footerLinks.legal.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-white/45 hover:text-white/90 transition-colors duration-300"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/25">
              &copy; {new Date().getFullYear()} Pathfinder AI. All rights
              reserved.
            </p>
            <div className="flex gap-6">
              {footerLinks.legal.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-xs text-white/25 hover:text-white/50 transition-colors duration-300"
                >
                  {label.split(" ").slice(-1)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
