"use client";
import Image from "next/image";
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
} from "lucide-react";
import { Form } from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { getUserOnboardingStatus } from "@/actions/user"; // <- server action

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Footer() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  /** Navigate with auth + onboarding guard */
  const go = async (href) => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    try {
      const { isOnboarded } = await getUserOnboardingStatus();
      router.push(isOnboarded ? href : "/onboarding");
    } catch (err) {
      console.error("Onboarding check failed:", err);
      router.push(href); // best-effort fallback
    }
  };

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 pt-14 pb-10 px-4 md:px-8 text-black dark:text-gray-300">
      <motion.div
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 text-sm"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={{ show: { transition: { staggerChildren: 0.15 } } }}
      >
        {/* Logo + Tagline */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-4">
            <Image
              src="/logo.png"
              alt="Pathfinder-AI Logo"
              width={200}
              height={180}
              className="h-6 w-auto"
            />
            <span className="text-xl md:text-2xl font-extrabold tracking-wide">
              Pathfinder-AI
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Your AI-powered guide for careers, resumes, mock interviews, and
            beyond.
          </p>
        </motion.div>

        {/* Navigation (protected) */}
        <motion.div variants={fadeUp}>
          <h3 className="text-xl md:text-2xl font-bold mb-4 border-b border-black/10 dark:border-white/20 pb-1">
            Explore
          </h3>
          <ul className="space-y-3">
            <li
              onClick={() => go("/dashboard")}
              className="flex items-center gap-2 cursor-pointer group hover:text-primary transition-all"
            >
              <LayoutDashboard className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
              Dashboard
            </li>
            <li
              onClick={() => go("/resume")}
              className="flex items-center gap-2 cursor-pointer group hover:text-primary transition-all"
            >
              <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
              Resume Builder
            </li>
            <li
              onClick={() => go("/interview")}
              className="flex items-center gap-2 cursor-pointer group hover:text-primary transition-all"
            >
              <Bot className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
              Mock Interviews
            </li>
            <li
              onClick={() => go("/ai-cover-letter")}
              className="flex items-center gap-2 cursor-pointer group hover:text-primary transition-all"
            >
              <PenBox className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
              AI Cover Letter
            </li>
          </ul>
        </motion.div>

        {/* Newsletter */}
        <motion.div variants={fadeUp}>
          <h3 className="text-xl md:text-2xl font-bold mb-4">Stay Updated</h3>
          <Form className="flex flex-col gap-3">
            <Input
              type="email"
              placeholder="Your email"
              className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-3 focus:ring-primary transition-colors"
            />
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white py-2 rounded-md transition dark:text-black"
            >
              Subscribe
            </Button>
          </Form>
        </motion.div>

        {/* Social */}
        <motion.div variants={fadeUp}>
          <h3 className="text-xl md:text-2xl font-bold mb-4">Connect</h3>
          <div className="flex gap-4">
            {[
              {
                href: "https://github.com/amitkumardemo/EdgeCareer",
                Icon: Github,
                label: "GitHub",
              },
              {
                href: "https://www.linkedin.com/in/harshvardhan-dwivedi-86b375290",
                Icon: Linkedin,
                label: "LinkedIn",
              },
              {
                href: "mailto:harshvardhandwivedi18@gmail.com",
                Icon: Mail,
                label: "Email",
              },
            ].map(({ href, Icon, label }) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="hover:text-primary transition-colors"
                whileHover={{ scale: 1.15, rotate: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="h-6 w-6" />
              </motion.a>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Copyright */}
      <motion.p
        className="mt-10 text-center text-gray-500 dark:text-gray-400 text-xs"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1, transition: { delay: 0.3 } }}
        viewport={{ once: true }}
      >
        © {new Date().getFullYear()} Pathfinder-AI. Built with 💡 by
        Pathfinder-AI.
      </motion.p>
    </footer>
  );
}
