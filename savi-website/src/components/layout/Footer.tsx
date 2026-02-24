"use client";

import React from "react";
import { cn } from "@/lib/utils";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Download App", href: "#download" },
      { label: "Web Portal", href: "#get-started" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#contact" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Community", href: "#" },
      { label: "API Docs", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "GDPR", href: "#" },
    ],
  },
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <a href="#" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <span className="text-white font-display font-bold text-lg">S</span>
              </div>
              <span className="font-display font-bold text-xl text-white">
                SAVI
              </span>
            </a>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
              The all-in-one community management platform. Connecting residents
              and property teams for smarter, happier living.
            </p>
            {/* App Store Badges */}
            <div className="flex gap-3">
              <a
                href="#"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-lg px-3 py-2 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div>
                  <div className="text-[10px] text-gray-400 leading-none">
                    Download on the
                  </div>
                  <div className="text-xs font-semibold leading-tight">
                    App Store
                  </div>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-lg px-3 py-2 transition-colors"
              >
                <svg width="18" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35m13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27m3.35-4.31c.34.27.56.69.56 1.19s-.22.92-.56 1.19l-2.51 1.43-2.51-2.51 2.51-2.51 2.51 1.21M6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z" />
                </svg>
                <div>
                  <div className="text-[10px] text-gray-400 leading-none">
                    Get it on
                  </div>
                  <div className="text-xs font-semibold leading-tight">
                    Google Play
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-sm text-white mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-primary-400 transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} SAVI. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {/* Social icons */}
              {["X", "LinkedIn", "GitHub", "Instagram"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-colors duration-200"
                  aria-label={social}
                >
                  <span className="text-xs text-gray-400 group-hover:text-white font-bold">
                    {social[0]}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
