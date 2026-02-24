"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Home, Users, Globe } from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";

interface CountUpProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

const CountUp: React.FC<CountUpProps> = ({
  end,
  suffix = "",
  prefix = "",
  duration = 2,
}) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const startTime = Date.now();
    const durationMs = duration * 1000;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [started, end, duration]);

  return (
    <div ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </div>
  );
};

const stats = [
  {
    icon: Building2,
    value: 500,
    suffix: "+",
    label: "Properties",
    description: "managed worldwide",
  },
  {
    icon: Home,
    value: 50000,
    suffix: "+",
    label: "Units",
    description: "across all communities",
  },
  {
    icon: Users,
    value: 200000,
    suffix: "+",
    label: "Residents",
    description: "using SAVI daily",
  },
  {
    icon: Globe,
    value: 15,
    suffix: "+",
    label: "Countries",
    description: "and growing",
  },
];

export const TrustedStats: React.FC = () => {
  return (
    <SectionWrapper className="py-20 lg:py-28 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-primary-200 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
            Trusted Worldwide
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Communities love SAVI
          </h2>
          <p className="text-lg text-white/60 max-w-lg mx-auto">
            Join thousands of communities already using SAVI to streamline their
            operations and delight residents.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon size={24} className="text-primary-300" />
              </div>
              <div className="font-display text-3xl sm:text-4xl font-bold text-white mb-1">
                <CountUp end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm font-semibold text-white/80 mb-0.5">
                {stat.label}
              </div>
              <div className="text-xs text-white/40">{stat.description}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};
