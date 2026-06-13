"use client";

import { motion } from "framer-motion";

export function HoverCard({ children, className, ...props }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, mass: 0.8 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
