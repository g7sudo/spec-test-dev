"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", href: "#" },
  {
    label: "Features",
    href: "#features",
    children: [
      { label: "Maintenance", href: "#maintenance" },
      { label: "Visitor Management", href: "#visitors" },
      { label: "Amenity Booking", href: "#amenities" },
      { label: "Notifications", href: "#notifications" },
      { label: "Resident Portal", href: "#resident-portal" },
      { label: "Property Dashboard", href: "#dashboard" },
    ],
  },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-soft"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <span className="text-white font-display font-bold text-lg">S</span>
            </div>
            <span
              className={cn(
                "font-display font-bold text-xl transition-colors duration-300",
                scrolled ? "text-gray-900" : "text-white"
              )}
            >
              SAVI
            </span>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) =>
              link.children ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setFeaturesOpen(true)}
                  onMouseLeave={() => setFeaturesOpen(false)}
                >
                  <button
                    className={cn(
                      "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                      scrolled
                        ? "text-gray-600 hover:text-primary-600 hover:bg-primary-50"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {link.label}
                    <ChevronDown
                      size={14}
                      className={cn(
                        "transition-transform duration-200",
                        featuresOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Dropdown */}
                  <div
                    className={cn(
                      "absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-200 origin-top",
                      featuresOpen
                        ? "opacity-100 scale-100 pointer-events-auto"
                        : "opacity-0 scale-95 pointer-events-none"
                    )}
                  >
                    <div className="py-2">
                      {link.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="block px-4 py-2.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                    scrolled
                      ? "text-gray-600 hover:text-primary-600 hover:bg-primary-50"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  {link.label}
                </a>
              )
            )}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant={scrolled ? "ghost" : "outline"}
              size="sm"
              href="#download"
            >
              Download App
            </Button>
            <Button variant="primary" size="sm" href="#get-started">
              Get Started
            </Button>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              "lg:hidden p-2 rounded-lg transition-colors",
              scrolled
                ? "text-gray-700 hover:bg-gray-100"
                : "text-white hover:bg-white/10"
            )}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden transition-all duration-300 overflow-hidden bg-white border-t border-gray-100",
          mobileOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 py-4 space-y-1">
          {navLinks.map((link) =>
            link.children ? (
              <div key={link.label}>
                <button
                  onClick={() => setFeaturesOpen(!featuresOpen)}
                  className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {link.label}
                  <ChevronDown
                    size={14}
                    className={cn(
                      "transition-transform duration-200",
                      featuresOpen && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-200",
                    featuresOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="pl-4 space-y-1 mt-1">
                    {link.children.map((child) => (
                      <a
                        key={child.label}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className="block px-3 py-2 text-sm text-gray-500 hover:text-primary-600 rounded-lg hover:bg-primary-50"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {link.label}
              </a>
            )
          )}
          <div className="pt-3 flex flex-col gap-2">
            <Button variant="secondary" size="md" href="#download" className="w-full">
              Download App
            </Button>
            <Button variant="primary" size="md" href="#get-started" className="w-full">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
