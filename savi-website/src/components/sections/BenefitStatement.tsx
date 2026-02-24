"use client";

import React from "react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";

export const BenefitStatement: React.FC = () => {
  return (
    <SectionWrapper className="py-20 lg:py-28 bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
            A well-managed community gives{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">
              peace of mind
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
            When maintenance is handled quickly, visitors are managed
            effortlessly, and amenities are always accessible — residents enjoy a
            better quality of life, and property teams work smarter.
          </p>
        </div>

        {/* Mini stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
          {[
            { value: "2x", label: "Faster response" },
            { value: "85%", label: "Resident satisfaction" },
            { value: "60%", label: "Less manual work" },
            { value: "24/7", label: "Self-service access" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 bg-white rounded-2xl shadow-soft"
            >
              <div className="font-display text-2xl sm:text-3xl font-bold text-primary-600 mb-1">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};
