"use client";

import React from "react";
import { motion } from "framer-motion";
import { Database, Lock, ShieldCheck } from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";

const securityFeatures = [
  {
    icon: Database,
    title: "Tenant Data Isolation",
    description:
      "Every community gets its own isolated database. No data mixing, no cross-contamination. Your community's data stays yours.",
    badge: "Architecture",
  },
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description:
      "All data is encrypted in transit and at rest. We use industry-standard TLS 1.3 and AES-256 encryption to protect every piece of information.",
    badge: "Encryption",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Privacy",
    description:
      "Built with GDPR compliance in mind. Role-based access control, audit logs, and strict privacy policies ensure your data is always protected.",
    badge: "Compliance",
  },
];

export const Security: React.FC = () => {
  return (
    <SectionWrapper id="security" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-primary-600 bg-primary-50 rounded-full px-4 py-1.5 mb-4">
            Security & Privacy
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Privacy & security by design
          </h2>
          <p className="text-lg text-gray-500">
            We take security seriously. Your community&apos;s data is protected with
            enterprise-grade infrastructure and strict privacy standards.
          </p>
        </div>

        {/* 3-column cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              className="relative bg-gray-50 rounded-2xl p-8 text-center hover:bg-white hover:shadow-lg border border-transparent hover:border-gray-100 transition-all duration-300"
            >
              {/* Badge */}
              <span className="inline-block text-xs font-semibold text-primary-600 bg-primary-50 rounded-full px-3 py-1 mb-4">
                {feature.badge}
              </span>

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-5">
                <feature.icon size={32} className="text-primary-600" />
              </div>

              {/* Content */}
              <h3 className="font-display text-lg font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Trust badges row */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
          {["SOC 2 Type II", "GDPR Compliant", "ISO 27001", "SSL Encrypted", "99.9% Uptime"].map(
            (badge) => (
              <div key={badge} className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-primary-400" />
                {badge}
              </div>
            )
          )}
        </div>
      </div>
    </SectionWrapper>
  );
};
