"use client";

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
import { useScrollLock } from "@/hooks/use-scroll-lock";

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

  useScrollLock(isMobileMenuOpen);

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
    setIsMobileMenuOpen(false);
  };


export default function Header() {
  return (
    <header
      style={{
        padding: "20px",
        borderBottom: "1px solid #333",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>
        Pathfinder AI
      </h1>

      <nav style={{ display: "flex", gap: "20px" }}>
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
      </nav>
    </header>
  );
}

