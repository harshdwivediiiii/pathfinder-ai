"use client";

import React, { useEffect, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";


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
  FileText,
  Bot,
  PenBox,
  GraduationCap,
  ChevronDown,
  StarsIcon,
  ScanText,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "./ui/Modetoggle";
import { useTheme } from "next-themes";
import { getUserOnboardingStatus } from "@/actions/user";

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
    const [open, setOpen] = useState(false);


  const isHomePage = pathname === "/";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);

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
    if (!isSignedIn) return router.push("/sign-in");
    try {
      const { isOnboarded } = await getUserOnboardingStatus();
      router.push(isOnboarded ? href : "/onboarding");
    } catch (err) {
      console.error("Onboarding check failed:", err);
      router.push(href);
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
  };

  return (
    <header  className="fixed top-0 left-0 right-0 z-50">
      {clerkKeyless && (
        <div className="w-full bg-yellow-400/90 text-yellow-900 text-sm py-1 text-center">
          Clerk running in keyless dev mode — auth is disabled locally.
        </div>
      )}
      <nav className="container mx-auto px-3 md:px-4 lg:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Image
            src={logoSrc}
            alt="Pathfinder AI Logo"
            width={42}
            height={42}
            className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110"
            priority
          />
          <span className="hidden sm:block text-xl font-semibold tracking-tight text-foreground">
            Pathfinder <span className="text-purple-600 dark:text-purple-400">AI</span>
          </span>
        </Link>

        {/* Navigation Links - Only on homepage */}
        {isHomePage && (
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`relative text-sm font-medium transition-all duration-300 pb-1 group ${
                  activeSection === link.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-purple-500 transition-all duration-300 ${
                    activeSection === link.id ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

      
        <div className="flex items-center gap-3">
          <ModeToggle />
          <button
  className="lg:hidden text-xl"
  onClick={() => setOpen(!open)}
>
  {open ? <FaTimes /> : <FaBars />}
</button>

          <SignedIn>
            <Button
              variant="outline"
              className="hidden md:flex items-center gap-2 hover:scale-105 transition-all duration-300"
              onClick={() => go("/dashboard")}
            >
              <LayoutDashboard className="h-4 w-4" />
              Industry Insights
            </Button>
          </SignedIn>

          <SignedOut>
            <SignInButton>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all duration-300 hover:scale-105">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 ring-2 ring-offset-2 ring-offset-background transition-all",
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>
        </div>
      
      </nav>
{/* Mobile Menu */}
  <div
    className={`lg:hidden absolute top-16 left-0 w-full transition-all duration-300 ease-in-out ${
      open
        ? "opacity-100 visible translate-y-0"
        : "opacity-0 invisible -translate-y-5"
    }`}
  >
    <div className="mx-4 mt-3 rounded-2xl border border-white/10 bg-white/10 dark:bg-black/40 backdrop-blur-xl shadow-2xl p-6">
      
      <ul className="flex flex-col gap-5 text-base font-medium">
        
        <li>
          <a
            href="#home"
            className="block rounded-lg px-4 py-3 hover:bg-cyan-500/10 hover:text-cyan-400 transition"
            onClick={() => setOpen(false)}
          >
            Home
          </a>
        </li>

        <li>
          <a
            href="#features"
            className="block rounded-lg px-4 py-3 hover:bg-cyan-500/10 hover:text-cyan-400 transition"
            onClick={() => setOpen(false)}
          >
            Features
          </a>
        </li>

        <li>
          <a
            href="#about"
            className="block rounded-lg px-4 py-3 hover:bg-cyan-500/10 hover:text-cyan-400 transition"
            onClick={() => setOpen(false)}
          >
            About
          </a>
        </li>

        <li>
          <a
            href="#feedback"
            className="block rounded-lg px-4 py-3 hover:bg-cyan-500/10 hover:text-cyan-400 transition"
            onClick={() => setOpen(false)}
          >
            Feedback
          </a>
        </li>

        <li>
          <a
            href="#question"
            className="block rounded-lg px-4 py-3 hover:bg-cyan-500/10 hover:text-cyan-400 transition"
            onClick={() => setOpen(false)}
          >
            F&Q
          </a>
        </li>

        <li>
          <a
            href="#contact"
            className="block rounded-lg px-4 py-3 hover:bg-cyan-500/10 hover:text-cyan-400 transition"
            onClick={() => setOpen(false)}
          >
            Contact Us
          </a>
        </li>
      </ul>

      {/* Mobile Buttons */}
      <div className="mt-6 flex flex-col gap-3">
        

        <SignedOut>
          <SignInButton>
            <Button className="w-full">Sign In</Button>
          </SignInButton>
        </SignedOut>
      </div>
    </div>
  </div>
  
      </header>
    );
  }
