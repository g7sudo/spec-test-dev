import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SAVI — Smart Community Management Platform",
  description:
    "The all-in-one community management platform that makes life easier for residents and property teams. Maintenance, visitors, amenities, and more.",
  keywords: [
    "community management",
    "property management",
    "resident portal",
    "maintenance requests",
    "visitor management",
    "amenity booking",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${outfit.variable}`}>
      <body className="font-sans text-gray-900 bg-white antialiased">
        {children}
      </body>
    </html>
  );
}
