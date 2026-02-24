"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Wrench,
  UserCheck,
  CalendarDays,
  Bell,
  Home,
  LayoutDashboard,
  Camera,
  CheckCircle2,
  Star,
  MessageSquare,
  QrCode,
  ClipboardCheck,
  Clock,
  Dumbbell,
  BellRing,
  BellDot,
  Megaphone,
  Users,
  FileText,
  BarChart3,
  Building2,
  PieChart,
  type LucideIcon,
} from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";
import { cn } from "@/lib/utils";

interface FeatureItem {
  icon: LucideIcon;
  text: string;
}

interface FeatureDetailData {
  id: string;
  badge: string;
  title: string;
  titleHighlight: string;
  description: string;
  features: FeatureItem[];
  illustration: {
    gradient: string;
    icon: LucideIcon;
    iconColor: string;
  };
}

const featureDetails: FeatureDetailData[] = [
  {
    id: "maintenance",
    badge: "Maintenance",
    title: "Report issues.",
    titleHighlight: "Track every step.",
    description:
      "Residents snap a photo, describe the issue, and submit. Property teams assign technicians, update status, and resolve — all in one workflow.",
    features: [
      { icon: Camera, text: "Photo attachments for clear issue reporting" },
      { icon: CheckCircle2, text: "Full workflow: Submitted to Completed" },
      { icon: Star, text: "Rate and review completed work" },
      { icon: MessageSquare, text: "In-app comments between resident and staff" },
    ],
    illustration: {
      gradient: "from-blue-400 via-blue-500 to-indigo-600",
      icon: Wrench,
      iconColor: "text-blue-200",
    },
  },
  {
    id: "visitors",
    badge: "Visitor Management",
    title: "Know who's coming.",
    titleHighlight: "Control who enters.",
    description:
      "Pre-register guests before they arrive, generate unique access codes, and manage walk-in visitors — all with a complete approval workflow.",
    features: [
      { icon: QrCode, text: "Unique access codes for every visitor" },
      { icon: ClipboardCheck, text: "Approval workflow with check-in/out tracking" },
      { icon: UserCheck, text: "Walk-in pass creation for security guards" },
      { icon: Bell, text: "Instant notifications when visitors arrive" },
    ],
    illustration: {
      gradient: "from-violet-400 via-violet-500 to-purple-600",
      icon: UserCheck,
      iconColor: "text-violet-200",
    },
  },
  {
    id: "amenities",
    badge: "Amenity Booking",
    title: "Book facilities.",
    titleHighlight: "Enjoy community life.",
    description:
      "Browse available amenities, check live availability, and reserve time slots — from the gym and pool to the clubhouse and BBQ area.",
    features: [
      { icon: Dumbbell, text: "Browse all community amenities" },
      { icon: Clock, text: "Real-time availability and time slots" },
      { icon: CalendarDays, text: "Easy booking and cancellation" },
      { icon: Users, text: "Manage capacity limits automatically" },
    ],
    illustration: {
      gradient: "from-emerald-400 via-emerald-500 to-teal-600",
      icon: CalendarDays,
      iconColor: "text-emerald-200",
    },
  },
  {
    id: "notifications",
    badge: "Smart Notifications",
    title: "Stay informed.",
    titleHighlight: "Never miss a thing.",
    description:
      "Get real-time push notifications for maintenance updates, visitor arrivals, booking confirmations, and community announcements.",
    features: [
      { icon: BellRing, text: "Push notifications on iOS and Android" },
      { icon: BellDot, text: "Real-time status change alerts" },
      { icon: Megaphone, text: "Community-wide announcements" },
      { icon: MessageSquare, text: "In-app notification center" },
    ],
    illustration: {
      gradient: "from-amber-400 via-amber-500 to-orange-600",
      icon: Bell,
      iconColor: "text-amber-200",
    },
  },
  {
    id: "resident-portal",
    badge: "Resident Portal",
    title: "Your home.",
    titleHighlight: "In your pocket.",
    description:
      "A beautiful mobile app where residents manage everything — from submitting requests and registering visitors to viewing lease details and community updates.",
    features: [
      { icon: Home, text: "View unit and lease information" },
      { icon: Users, text: "Family and co-tenant management" },
      { icon: FileText, text: "Access documents and notices" },
      { icon: Star, text: "Rate and review community services" },
    ],
    illustration: {
      gradient: "from-cyan-400 via-cyan-500 to-blue-600",
      icon: Home,
      iconColor: "text-cyan-200",
    },
  },
  {
    id: "dashboard",
    badge: "Property Dashboard",
    title: "Manage everything.",
    titleHighlight: "From one place.",
    description:
      "A powerful web portal for property managers. Oversee all properties, track KPIs, manage staff, and make data-driven decisions with built-in analytics.",
    features: [
      { icon: Building2, text: "Multi-property management in one portal" },
      { icon: BarChart3, text: "Real-time KPIs and analytics" },
      { icon: PieChart, text: "Occupancy and revenue insights" },
      { icon: LayoutDashboard, text: "Customizable dashboard views" },
    ],
    illustration: {
      gradient: "from-rose-400 via-rose-500 to-pink-600",
      icon: LayoutDashboard,
      iconColor: "text-rose-200",
    },
  },
];

interface FeatureSectionProps {
  data: FeatureDetailData;
  reversed?: boolean;
}

const FeatureSection: React.FC<FeatureSectionProps> = ({ data, reversed }) => {
  return (
    <SectionWrapper
      id={data.id}
      className={cn("py-20 lg:py-28", reversed ? "bg-surface-50" : "bg-white")}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "grid lg:grid-cols-2 gap-12 lg:gap-20 items-center",
            reversed && "lg:direction-rtl"
          )}
        >
          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, x: reversed ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={cn("lg:direction-ltr", reversed && "lg:order-2")}
          >
            <div
              className={cn(
                "aspect-[4/3] rounded-3xl bg-gradient-to-br p-8 flex items-center justify-center relative overflow-hidden",
                data.illustration.gradient
              )}
            >
              {/* Background pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />

              {/* Large icon */}
              <data.illustration.icon
                size={200}
                strokeWidth={0.5}
                className={cn(
                  "absolute -bottom-8 -right-8 opacity-20",
                  data.illustration.iconColor
                )}
              />

              {/* Mock cards */}
              <div className="relative space-y-3 w-full max-w-xs">
                {data.features.slice(0, 3).map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                    className="bg-white/95 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 shadow-lg"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <feature.icon size={16} className="text-gray-600" />
                    </div>
                    <div className="text-xs text-gray-700 font-medium leading-tight">
                      {feature.text}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: reversed ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={cn("lg:direction-ltr", reversed && "lg:order-1")}
          >
            <span className="inline-block text-sm font-semibold text-primary-600 bg-primary-50 rounded-full px-4 py-1.5 mb-4">
              {data.badge}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {data.title}
            </h2>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700 mb-6">
              {data.titleHighlight}
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              {data.description}
            </p>

            <ul className="space-y-3">
              {data.features.map((feature, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
                  className="flex items-center gap-3 text-sm text-gray-600"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <feature.icon size={16} className="text-primary-600" />
                  </div>
                  {feature.text}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export const FeatureDetails: React.FC = () => {
  return (
    <>
      {featureDetails.map((data, index) => (
        <FeatureSection key={data.id} data={data} reversed={index % 2 === 1} />
      ))}
    </>
  );
};
