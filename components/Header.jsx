"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  useAuth,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import {
  LayoutDashboard,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { ModeToggle } from "./ui/Modetoggle";
import { useTheme } from "next-themes";
import { getUserOnboardingStatus } from "@/actions/user";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How It Works" },
  { id: "stats", label: "Stats" },
];

export default function Header() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [clerkKeyless, setClerkKeyless] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navigatingHref, setNavigatingHref] = useState(null);

  const isHomePage = pathname === "/";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sections = NAV_LINKS.map((link) => ({
        id: link.id,
        element: document.getElementById(link.id),
      }));

      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        if (section.element) {
          const { offsetTop, offsetHeight } = section.element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/dev/status")
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.clerkKeyless) setClerkKeyless(true);
      })
      .catch(() => {});
    return () => (active = false);
  }, []);

  const logoSrc =
    mounted && resolvedTheme === "dark" ? "/white-logo.png" : "/logo.png";

  const go = async (href) => {
    if (navigatingHref) return;
    if (!isSignedIn) return router.push("/sign-in");
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

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "py-2 glass border-b border-white/10"
            : "py-4 bg-transparent"
        }`}
      >
        {clerkKeyless && (
          <div className="absolute top-0 left-0 w-full bg-yellow-400/90 text-yellow-900 text-[10px] font-bold py-0.5 text-center uppercase tracking-widest z-[60]">
            Keyless Mode Active
          </div>
        )}
        <nav className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Image
                src={logoSrc}
                alt="Pathfinder AI Logo"
                width={32}
                height={32}
                className="h-7 w-7 object-contain transition-transform duration-500 group-hover:scale-110"
                priority
              />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground flex items-center">
              Pathfinder <span className="text-primary ml-1">AI</span>
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {isHomePage ? (
              NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                    activeSection === link.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {link.label}
                </button>
              ))
            ) : (
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ModeToggle />
            
            <div className="hidden sm:block">
              <SignedIn>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-primary transition-all rounded-full"
                  onClick={() => go("/dashboard")}
                  disabled={!!navigatingHref}
                >
                  {navigatingHref === "/dashboard" ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <LayoutDashboard className="h-4 w-4" />
                  )}
                  Dashboard
                </Button>
              </SignedIn>

              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="sm" className="rounded-full px-5 font-semibold group">
                    Sign In
                    <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>

            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 ring-2 ring-primary/20 hover:ring-primary/50 transition-all",
                  },
                }}
                afterSignOutUrl="/"
              />
            </SignedIn>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background md:hidden pt-24 px-6"
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-4">Navigation</span>
                {isHomePage ? (
                  NAV_LINKS.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.id)}
                      className="text-left px-4 py-3 text-xl font-semibold hover:text-primary transition-colors border-b border-border/50"
                    >
                      {link.label}
                    </button>
                  ))
                ) : (
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-xl font-semibold hover:text-primary transition-colors border-b border-border/50"
                  >
                    Home
                  </Link>
                )}
              </div>

              <div className="flex flex-col gap-4 mt-4">
                <SignedIn>
                  <Button
                    className="w-full h-12 text-lg font-semibold rounded-2xl gap-2"
                    onClick={async () => {
                      await go("/dashboard");
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={!!navigatingHref}
                  >
                    {navigatingHref === "/dashboard" ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : null}
                    Go to Dashboard
                  </Button>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button className="w-full h-12 text-lg font-semibold rounded-2xl">
                      Sign In
                    </Button>
                  </SignInButton>
                </SignedOut>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
