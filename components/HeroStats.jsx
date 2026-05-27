"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users, Target, TrendingUp, Star } from "lucide-react";

const STATS_DATA = [
  {
    value: "10k+",
    label: "Students Guided",
    icon: Users,
    gradient: "from-purple-500 to-purple-700",
    bgLight: "bg-purple-100",
    bgDark: "dark:bg-purple-500/10",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  {
    value: "94%",
    label: "Career Matches",
    icon: Target,
    gradient: "from-blue-500 to-blue-700",
    bgLight: "bg-blue-100",
    bgDark: "dark:bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    value: "92%",
    label: "Success Rate",
    icon: TrendingUp,
    gradient: "from-green-500 to-emerald-700",
    bgLight: "bg-green-100",
    bgDark: "dark:bg-green-500/10",
    textColor: "text-green-600 dark:text-green-400",
  },
  {
    value: "4.8",
    label: "Avg Rating",
    icon: Star,
    gradient: "from-orange-500 to-yellow-600",
    bgLight: "bg-orange-100",
    bgDark: "dark:bg-orange-500/10",
    textColor: "text-orange-600 dark:text-orange-400",
  },
];

export default function HeroStats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div
      ref={ref}
      className="mx-auto grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4"
    >
      {STATS_DATA.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.05 }}
            className="group flex flex-col items-center space-y-3 p-6 rounded-2xl bg-card border border-border hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
          >
            {/* Icon with colored background */}
            <div
              className={`p-3 rounded-xl ${stat.bgLight} ${stat.bgDark} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
            >
              <Icon className={`w-6 h-6 ${stat.textColor}`} />
            </div>

            {/* Number with gradient */}
            <h3 className="text-4xl md:text-5xl font-bold">
              <span
                className={`bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`}
              >
                {stat.value}
              </span>
            </h3>

            {/* Label */}
            <p className="text-sm md:text-base text-muted-foreground font-medium">
              {stat.label}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}