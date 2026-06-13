"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Users, Target, TrendingUp, Star } from "lucide-react";

const STATS_DATA = [
  {
    value: 10000,
    suffix: "+",
    label: "Students Guided",
    icon: Users,
    gradient: "from-purple-500 to-purple-700",
    bgLight: "bg-purple-100",
    bgDark: "dark:bg-purple-500/10",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  {
    value: 94,
    suffix: "%",
    label: "Career Matches",
    icon: Target,
    gradient: "from-blue-500 to-blue-700",
    bgLight: "bg-blue-100",
    bgDark: "dark:bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    value: 92,
    suffix: "%",
    label: "Success Rate",
    icon: TrendingUp,
    gradient: "from-green-500 to-emerald-700",
    bgLight: "bg-green-100",
    bgDark: "dark:bg-green-500/10",
    textColor: "text-green-600 dark:text-green-400",
  },
  {
    value: 4.8,
    decimal: true,
    label: "Avg Rating",
    icon: Star,
    gradient: "from-orange-500 to-yellow-600",
    bgLight: "bg-orange-100",
    bgDark: "dark:bg-orange-500/10",
    textColor: "text-orange-600 dark:text-orange-400",
  },
];

function CountUp({ end, isInView, suffix = "", decimal = false }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let startTime;
    const duration = 2000;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;

      const progress = Math.min((timestamp - startTime) / duration, 1);

      const currentValue = progress * end;

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, isInView]);

  const formattedValue = decimal
    ? count.toFixed(1)
    : Math.floor(count).toLocaleString();

  return (
    <>
      {formattedValue}
      {suffix}
    </>
  );
}

export default function HeroStats() {
  const ref = useRef(null);

  const isInView = useInView(ref, {
    once: true,
    amount: 0.2,
  });

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
            transition={{
              duration: 0.6,
              delay: index * 0.1,
            }}
            whileHover={{
              y: -5,
              scale: 1.02,
            }}
            className="group flex flex-col items-center space-y-3 rounded-2xl border border-border/40 p-6 glass transition-all duration-300 hover:border-primary/30 hover:shadow-xl"
          >
            <div
              className={`p-3 rounded-xl ${stat.bgLight} ${stat.bgDark} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
            >
              <Icon className={`w-6 h-6 ${stat.textColor}`} />
            </div>

            <h3 className="text-4xl font-bold md:text-5xl">
              <span
                className={`bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`}
              >
                <CountUp
                  end={stat.value}
                  suffix={stat.suffix}
                  decimal={stat.decimal}
                  isInView={isInView}
                />
              </span>
            </h3>

            <p className="text-sm font-medium text-muted-foreground md:text-base">
              {stat.label}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}