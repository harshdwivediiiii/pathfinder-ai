"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "./button";
import InteractiveBackground from "../Background";
import { useTheme } from "next-themes";

const ScrollToTop = () => {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { resolvedTheme } = useTheme(); // light / dark / system

  useEffect(() => {
    setMounted(true);

    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  if (!mounted || !isVisible) return null;

  return (
    <>
      <InteractiveBackground isDarkMode={resolvedTheme === "dark"} />

      <Button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        variant="ghost" // or remove variant and use custom class below
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-transparent hover:bg-muted/30 transition-colors backdrop-blur"
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </>
  );
};

export default ScrollToTop;
