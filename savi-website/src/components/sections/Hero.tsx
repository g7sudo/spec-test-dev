"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MockupPhone } from "@/components/shared/MockupPhone";

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900" />
      {/* Decorative blobs */}
      <div className="absolute top-20 right-[10%] w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-[5%] w-[400px] h-[400px] bg-accent-500/10 rounded-full blur-3xl" />
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
              <span className="text-sm text-white/80">
                Now available on iOS & Android
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
              Smarter living for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-300 to-accent-500">
                modern communities
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/70 leading-relaxed mb-8 max-w-lg">
              The all-in-one platform that connects residents and property teams.
              Manage maintenance, visitors, amenities, and more — effortlessly.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-10">
              <Button variant="accent" size="lg" href="#get-started">
                Get Started Free
                <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button variant="outline" size="lg" href="#demo">
                <Play size={16} className="mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* App Store Badges */}
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2.5 transition-colors"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div>
                  <div className="text-[10px] text-white/50 leading-none">
                    Download on the
                  </div>
                  <div className="text-sm font-semibold text-white leading-tight">
                    App Store
                  </div>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2.5 transition-colors"
              >
                <svg
                  width="20"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35m13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27m3.35-4.31c.34.27.56.69.56 1.19s-.22.92-.56 1.19l-2.51 1.43-2.51-2.51 2.51-2.51 2.51 1.21M6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z" />
                </svg>
                <div>
                  <div className="text-[10px] text-white/50 leading-none">
                    Get it on
                  </div>
                  <div className="text-sm font-semibold text-white leading-tight">
                    Google Play
                  </div>
                </div>
              </a>
              <a
                href="#get-started"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2.5 transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
                <div>
                  <div className="text-[10px] text-white/50 leading-none">
                    Open in
                  </div>
                  <div className="text-sm font-semibold text-white leading-tight">
                    Web App
                  </div>
                </div>
              </a>
            </div>
          </motion.div>

          {/* Right — Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex justify-center lg:justify-end"
          >
            <MockupPhone
              className="transform lg:translate-x-4"
              gradient="from-primary-300 via-teal-400 to-primary-600"
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 100"
          fill="none"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 50C240 90 480 100 720 80C960 60 1200 20 1440 50V100H0V50Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
};
