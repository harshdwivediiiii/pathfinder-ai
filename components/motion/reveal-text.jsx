"use client";

import { motion } from "framer-motion";

export function RevealText({ children, delay = 0, className, as = "span" }) {
  const text = typeof children === "string" ? children : "";
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: delay },
    },
  };

  const child = {
    hidden: { opacity: 0, y: 20, rotateX: -90 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { type: "spring", stiffness: 120, damping: 25, mass: 0.8 },
    },
  };

  if (typeof children !== "string") {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.span
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={className}
      style={{ display: "inline-flex", flexWrap: "wrap", gap: "0.25em" }}
    >
      {words.map((word, i) => (
        <span key={i} style={{ display: "inline-block", overflow: "hidden" }}>
          <motion.span variants={child} style={{ display: "inline-block" }}>
            {word}
            {i < words.length - 1 && "\u00A0"}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
