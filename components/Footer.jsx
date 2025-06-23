"use client";

import Link from "next/link";
import { Github, Linkedin, Mail,LayoutDashboard,FileText,Bot,PenBox } from "lucide-react";
import { Form } from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import Image from "next/image";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:  { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Footer() {
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
            <Image src="/logo.png" alt="Pathfinder-AI Logo" className="h-6 w-auto" height={200} width={180} />
            <span className="text-xl md:text-2xl font-extrabold tracking-wide">
              Pathfinder-AI
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Your AI-powered guide for careers, resumes, mock interviews, and beyond.
          </p>
        </motion.div>

        {/* Navigation */}
      <motion.div variants={fadeUp}>
  <h3 className="text-xl md:text-2xl font-bold mb-4 border-b border-black/10 dark:border-white/20 pb-1">
    Explore
  </h3>
  <ul className="space-y-3">
    <li>
      <Link
        href="/dashboard"
        className="flex items-center gap-2 hover:text-primary transition-all group"
      >
        <LayoutDashboard className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
        Dashboard
      </Link>
    </li>
    <li>
      <Link
        href="/resume"
        className="flex items-center gap-2 hover:text-primary transition-all group"
      >
        <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
        Resume Builder
      </Link>
    </li>
    <li>
      <Link
        href="/interview"
        className="flex items-center gap-2 hover:text-primary transition-all group"
      >
        <Bot className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
        Mock Interviews
      </Link>
    </li>
    <li>
      <Link
        href="/ai-cover-letter"
        className="flex items-center gap-2 hover:text-primary transition-all group"
      >
        <PenBox className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
        AI Cover Letter
      </Link>
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
              className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white
                         px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600
                         focus:outline-none focus:ring-3 focus:ring-primary transition-colors"
            />
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white py-2 rounded-md transition dark:text-black"
            >
              Subscribe
            </Button>
          </Form>
        </motion.div>

        {/* Social Links */}
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
              { href: "mailto:harshvardhandwivedi18@gmail.com", Icon: Mail, label: "Email" },
            ].map(({ href, Icon, label }) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                whileHover={{ scale: 1.15, rotate: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label={label}
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
        © {new Date().getFullYear()} Pathfinder-AI. Built with 💡 by Pathfinder-AI.
      </motion.p>
    </footer>
  );
}
