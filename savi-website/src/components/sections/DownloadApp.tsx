"use client";

import React from "react";
import { Smartphone, QrCode } from "lucide-react";
import { SectionWrapper } from "@/components/shared/SectionWrapper";

export const DownloadApp: React.FC = () => {
  return (
    <SectionWrapper id="download" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* QR Code placeholder */}
          <div className="shrink-0">
            <div className="w-40 h-40 bg-white rounded-2xl shadow-soft flex items-center justify-center p-4">
              <div className="w-full h-full border-2 border-dashed border-primary-200 rounded-xl flex flex-col items-center justify-center gap-2">
                <QrCode size={48} className="text-primary-400" />
                <span className="text-[10px] text-primary-400 font-medium">
                  QR Code
                </span>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="text-center md:text-left">
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Get the SAVI mobile app
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              Scan the QR code with your phone camera or download directly from
              your app store. Available for iOS and Android.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <a
                href="#"
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5 py-3 transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 leading-none">
                    Download on the
                  </div>
                  <div className="text-sm font-semibold leading-tight">
                    App Store
                  </div>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5 py-3 transition-colors"
              >
                <svg
                  width="18"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35m13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27m3.35-4.31c.34.27.56.69.56 1.19s-.22.92-.56 1.19l-2.51 1.43-2.51-2.51 2.51-2.51 2.51 1.21M6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z" />
                </svg>
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 leading-none">
                    Get it on
                  </div>
                  <div className="text-sm font-semibold leading-tight">
                    Google Play
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Phone illustration */}
          <div className="hidden lg:flex shrink-0 ml-auto">
            <div className="relative">
              <Smartphone
                size={120}
                strokeWidth={1}
                className="text-primary-300"
              />
              <div className="absolute inset-4 top-6 bottom-6 bg-gradient-to-br from-primary-200 to-primary-300 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};
