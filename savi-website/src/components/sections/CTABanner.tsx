"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionWrapper } from "@/components/shared/SectionWrapper";

export const CTABanner: React.FC = () => {
  return (
    <SectionWrapper className="py-20 lg:py-28 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-[10%] w-64 h-64 bg-accent-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-[10%] w-80 h-80 bg-primary-400/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles size={14} className="text-accent-400" />
            <span className="text-sm text-white/80">
              Start your free trial today
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Let&apos;s create the community{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-300 to-accent-500">
              you deserve
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Join hundreds of communities already using SAVI to transform their
            resident experience and streamline property management.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="accent" size="xl" href="#get-started">
              Get Started Free
              <ArrowRight size={18} className="ml-2" />
            </Button>
            <Button variant="outline" size="xl" href="#contact">
              Contact Sales
            </Button>
          </div>

          {/* Trust line */}
          <p className="mt-8 text-sm text-white/40">
            No credit card required &middot; Free 14-day trial &middot; Cancel
            anytime
          </p>
        </motion.div>
      </div>
    </SectionWrapper>
  );
};
