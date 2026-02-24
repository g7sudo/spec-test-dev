"use client";

import React from "react";
import { motion } from "framer-motion";
import { Smartphone, Monitor, ArrowRight } from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";
import { MockupPhone } from "@/components/shared/MockupPhone";

export const AppVsPortal: React.FC = () => {
  return (
    <SectionWrapper className="py-20 lg:py-28 bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Available everywhere
          </h2>
          <p className="text-lg text-gray-500">
            Access SAVI from your phone, tablet, or desktop. Your community is
            always at your fingertips.
          </p>
        </div>

        {/* Two product cards */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Mobile App */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl overflow-hidden shadow-soft group hover:shadow-lg transition-shadow"
          >
            {/* Mockup area */}
            <div className="bg-gradient-to-br from-primary-100 to-primary-200 p-8 flex justify-center">
              <MockupPhone
                className="transform scale-75 -my-8"
                gradient="from-primary-400 via-teal-400 to-primary-600"
              />
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Smartphone size={20} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-gray-900">
                    SAVI Mobile
                  </h3>
                  <p className="text-sm text-gray-500">For residents</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                A beautiful, intuitive app that residents actually want to use.
                Available on iOS and Android.
              </p>
              <a
                href="#download"
                className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 group-hover:translate-x-1 transition-transform"
              >
                Download App
                <ArrowRight size={16} className="ml-1" />
              </a>
            </div>
          </motion.div>

          {/* Web Portal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-white rounded-3xl overflow-hidden shadow-soft group hover:shadow-lg transition-shadow"
          >
            {/* Mockup area */}
            <div className="bg-gradient-to-br from-primary-700 to-primary-900 p-8 flex justify-center">
              {/* Desktop mockup */}
              <div className="relative w-full max-w-sm">
                {/* Browser chrome */}
                <div className="bg-gray-800 rounded-t-xl p-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-md h-5 mx-2 flex items-center px-2">
                    <span className="text-[10px] text-gray-400">
                      app.savi.community
                    </span>
                  </div>
                </div>
                {/* Screen content */}
                <div className="bg-gray-100 p-4 rounded-b-xl min-h-[180px]">
                  {/* Mini dashboard mockup */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white rounded-lg p-2 shadow-sm">
                        <div className="w-8 h-1.5 bg-primary-200 rounded mb-1" />
                        <div className="w-12 h-3 bg-primary-400 rounded" />
                      </div>
                      <div className="flex-1 bg-white rounded-lg p-2 shadow-sm">
                        <div className="w-8 h-1.5 bg-amber-200 rounded mb-1" />
                        <div className="w-10 h-3 bg-amber-400 rounded" />
                      </div>
                      <div className="flex-1 bg-white rounded-lg p-2 shadow-sm">
                        <div className="w-8 h-1.5 bg-emerald-200 rounded mb-1" />
                        <div className="w-14 h-3 bg-emerald-400 rounded" />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="w-24 h-2 bg-gray-200 rounded mb-2" />
                      <div className="space-y-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-gray-100" />
                            <div className="flex-1 h-1.5 bg-gray-100 rounded" />
                            <div className="w-10 h-4 rounded-full bg-primary-50" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Monitor size={20} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-gray-900">
                    SAVI Portal
                  </h3>
                  <p className="text-sm text-gray-500">For property managers</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                A comprehensive web dashboard built for efficiency. Manage
                everything from maintenance to analytics.
              </p>
              <a
                href="#get-started"
                className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 group-hover:translate-x-1 transition-transform"
              >
                Get Started
                <ArrowRight size={16} className="ml-1" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </SectionWrapper>
  );
};
