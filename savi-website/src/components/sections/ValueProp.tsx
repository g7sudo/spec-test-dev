"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";

const benefits = [
  "Submit and track maintenance requests with real-time status updates",
  "Pre-register visitors and generate instant access codes",
  "Book community amenities with live availability",
  "Get push notifications for every important update",
  "Manage multiple properties from a single dashboard",
  "Secure, isolated data for every community",
];

export const ValueProp: React.FC = () => {
  return (
    <SectionWrapper className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Illustration */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-square max-w-lg mx-auto bg-gradient-to-br from-primary-50 via-primary-100 to-accent-50 rounded-3xl p-8 flex items-center justify-center">
              {/* Illustration: abstract dashboard mockup */}
              <div className="w-full max-w-sm space-y-4">
                {/* Header bar */}
                <div className="bg-white rounded-xl shadow-soft p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <div className="w-5 h-5 rounded bg-primary-400" />
                  </div>
                  <div className="flex-1">
                    <div className="w-24 h-2.5 bg-gray-200 rounded" />
                    <div className="w-16 h-2 bg-gray-100 rounded mt-1.5" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-accent-100" />
                </div>

                {/* Stat row */}
                <div className="grid grid-cols-3 gap-3">
                  {["primary", "accent", "emerald"].map((color) => (
                    <div
                      key={color}
                      className="bg-white rounded-xl shadow-soft p-3 text-center"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg mx-auto mb-2 bg-${color === "primary" ? "primary" : color === "accent" ? "amber" : "emerald"}-100`}
                      />
                      <div className="w-12 h-2 bg-gray-200 rounded mx-auto" />
                    </div>
                  ))}
                </div>

                {/* List items */}
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-soft p-3 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-50 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="w-3/4 h-2 bg-gray-200 rounded" />
                      <div className="w-1/2 h-2 bg-gray-100 rounded" />
                    </div>
                    <div className="w-16 h-6 rounded-full bg-primary-50" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right — Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="inline-block text-sm font-semibold text-primary-600 bg-primary-50 rounded-full px-4 py-1.5 mb-4">
              Why SAVI?
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Managing your community starts with SAVI
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Whether you&apos;re a resident wanting hassle-free living or a property
              manager overseeing hundreds of units — SAVI brings everything
              together in one beautiful, intuitive platform.
            </p>

            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} className="text-primary-600" />
                  </div>
                  <span className="text-gray-600 text-sm leading-relaxed">
                    {benefit}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </SectionWrapper>
  );
};
