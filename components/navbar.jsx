"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/use-scroll-lock";

const NAV_LINKS = [
  { id: "features", label: "Features", href: "/#features" },
  { id: "pricing", label: "Pricing", href: "/#pricing" },
  { id: "about", label: "About", href: "/#about" },
  { id: "question", label: "FAQ", href: "/#question" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useScrollLock(mobileOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const scrollTo = useCallback(
    (e, id) => {
      e.preventDefault();
      if (pathname !== "/") {
        router.push(id ? `/#${id}` : "/");
        return;
      }
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setMobileOpen(false);
    },
    [pathname, router]
  );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-soft"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all duration-300">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-foreground hidden sm:block">
              PathFinder
              <span className="text-primary"> AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => scrollTo(e, link.id)}
                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50 transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <div className="hidden md:flex items-center gap-2">
              {isSignedIn ? (
                <Button
                  asChild
                  variant="ghost"
                  className="h-9 px-4 rounded-xl text-sm font-semibold"
                >
                  <Link href="/dashboard">
                    Dashboard
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="h-9 px-4 rounded-xl text-sm font-semibold"
                    asChild
                  >
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    className="h-9 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 text-sm font-bold"
                  >
                    <Link href="/sign-up">
                      Get Started
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden h-9 w-9 rounded-xl border border-border/40 bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-all"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-4 w-4 text-foreground" />
              ) : (
                <Menu className="h-4 w-4 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={(e) => scrollTo(e, link.id)}
                    className="px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50 transition-all"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="pt-2 border-t border-border/30 flex flex-col gap-2">
                {isSignedIn ? (
                  <Button
                    asChild
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                  >
                    <Link href="/dashboard">
                      Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-xl font-semibold"
                      asChild
                    >
                      <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button
                      className="w-full h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                      asChild
                    >
                      <Link href="/sign-up">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
