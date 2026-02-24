"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Wrench,
  UserCheck,
  CalendarDays,
  Bell,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";

const features = [
  {
    icon: Wrench,
    title: "Maintenance",
    description:
      "Submit requests with photos, track progress in real time, and rate completed work.",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    href: "#maintenance",
  },
  {
    icon: UserCheck,
    title: "Visitor Management",
    description:
      "Pre-register guests, generate access codes, and manage check-in/out seamlessly.",
    color: "from-violet-500 to-violet-600",
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
    href: "#visitors",
  },
  {
    icon: CalendarDays,
    title: "Amenity Booking",
    description:
      "Reserve the gym, pool, or clubhouse in seconds. View availability at a glance.",
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    href: "#amenities",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Real-time updates on requests, visitor arrivals, approvals, and community news.",
    color: "from-amber-500 to-amber-600",
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    href: "#notifications",
  },
  {
    icon: LayoutDashboard,
    title: "Property Dashboard",
    description:
      "Manage multiple properties from a single portal with KPIs and analytics.",
    color: "from-rose-500 to-rose-600",
    bg: "bg-rose-50",
    iconColor: "text-rose-600",
    href: "#dashboard",
  },
  {
    icon: Shield,
    title: "Security & Privacy",
    description:
      "Enterprise-grade encryption, tenant data isolation, and full compliance.",
    color: "from-teal-500 to-teal-600",
    bg: "bg-teal-50",
    iconColor: "text-teal-600",
    href: "#security",
  },
];

export const FeatureCards: React.FC = () => {
  return (
    <SectionWrapper id="features" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-primary-600 bg-primary-50 rounded-full px-4 py-1.5 mb-4">
            All Features
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything your community needs
          </h2>
          <p className="text-lg text-gray-500">
            A complete toolkit for modern community management, designed for
            both residents and property teams.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.a
              key={feature.title}
              href={feature.href}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon size={24} className={feature.iconColor} />
              </div>

              {/* Content */}
              <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>

              {/* Arrow */}
              <div className="mt-4 flex items-center text-sm font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Learn more
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="ml-1 group-hover:translate-x-1 transition-transform"
                >
                  <path
                    d="M6 12L10 8L6 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};
