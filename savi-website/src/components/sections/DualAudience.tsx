"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  Monitor,
  Home,
  Wrench,
  UserCheck,
  CalendarDays,
  Bell,
  Building2,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";

const audiences = [
  {
    title: "For Residents",
    subtitle: "A beautiful mobile app",
    icon: Smartphone,
    gradient: "from-primary-500 to-teal-600",
    features: [
      { icon: Wrench, label: "Submit maintenance requests" },
      { icon: UserCheck, label: "Register visitors" },
      { icon: CalendarDays, label: "Book amenities" },
      { icon: Bell, label: "Get real-time notifications" },
      { icon: Home, label: "View unit & lease details" },
    ],
    cta: "Download App",
    ctaHref: "#download",
  },
  {
    title: "For Property Managers",
    subtitle: "A powerful web portal",
    icon: Monitor,
    gradient: "from-primary-700 to-primary-900",
    features: [
      { icon: Building2, label: "Multi-property management" },
      { icon: BarChart3, label: "KPIs & analytics dashboard" },
      { icon: Users, label: "Staff & resident management" },
      { icon: Settings, label: "Workflow configuration" },
      { icon: Wrench, label: "Maintenance operations" },
    ],
    cta: "Get Started",
    ctaHref: "#get-started",
  },
];

export const DualAudience: React.FC = () => {
  return (
    <SectionWrapper className="py-20 lg:py-28 bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-primary-600 bg-primary-50 rounded-full px-4 py-1.5 mb-4">
            Built for Everyone
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            One platform, two experiences
          </h2>
          <p className="text-lg text-gray-500">
            Residents use the mobile app. Property teams use the web portal.
            Both connected, both powerful.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-lg transition-shadow duration-300"
            >
              {/* Top gradient band */}
              <div
                className={`h-2 bg-gradient-to-r ${audience.gradient}`}
              />

              <div className="p-8">
                {/* Icon & Title */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${audience.gradient} flex items-center justify-center`}
                  >
                    <audience.icon size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-gray-900">
                      {audience.title}
                    </h3>
                    <p className="text-sm text-gray-500">{audience.subtitle}</p>
                  </div>
                </div>

                {/* Feature list */}
                <ul className="space-y-3 mb-8">
                  {audience.features.map((feature) => (
                    <li
                      key={feature.label}
                      className="flex items-center gap-3 text-sm text-gray-600"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        <feature.icon
                          size={16}
                          className="text-primary-600"
                        />
                      </div>
                      {feature.label}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={audience.ctaHref}
                  className={`inline-flex items-center justify-center w-full h-12 rounded-xl bg-gradient-to-r ${audience.gradient} text-white font-semibold text-sm hover:opacity-90 transition-opacity`}
                >
                  {audience.cta}
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};
