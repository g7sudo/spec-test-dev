"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MockupPhoneProps {
  className?: string;
  screenContent?: React.ReactNode;
  gradient?: string;
}

export const MockupPhone: React.FC<MockupPhoneProps> = ({
  className,
  screenContent,
  gradient = "from-primary-400 via-primary-500 to-primary-700",
}) => {
  return (
    <div className={cn("relative", className)}>
      {/* Phone frame */}
      <div className="relative mx-auto w-[280px] h-[580px] bg-gray-900 rounded-[3rem] shadow-2xl border-[8px] border-gray-800 overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-gray-900 rounded-b-2xl z-10" />

        {/* Screen */}
        <div className={cn("w-full h-full rounded-[2.2rem] overflow-hidden bg-gradient-to-br", gradient)}>
          {screenContent || (
            <div className="flex flex-col items-center justify-center h-full p-6 text-white/90">
              {/* Mock app header */}
              <div className="w-full mb-auto pt-12">
                <div className="flex items-center justify-between px-2">
                  <div className="w-8 h-8 rounded-full bg-white/20" />
                  <div className="text-sm font-semibold">SAVI</div>
                  <div className="w-8 h-8 rounded-full bg-white/20" />
                </div>
              </div>

              {/* Mock content cards */}
              <div className="w-full space-y-3 mb-auto">
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
                  <div className="w-20 h-2 bg-white/30 rounded mb-2" />
                  <div className="w-full h-2 bg-white/20 rounded mb-1" />
                  <div className="w-3/4 h-2 bg-white/20 rounded" />
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
                  <div className="w-16 h-2 bg-white/30 rounded mb-2" />
                  <div className="w-full h-2 bg-white/20 rounded mb-1" />
                  <div className="w-2/3 h-2 bg-white/20 rounded" />
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20" />
                    <div className="flex-1">
                      <div className="w-24 h-2 bg-white/30 rounded mb-1" />
                      <div className="w-16 h-2 bg-white/20 rounded" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock bottom nav */}
              <div className="w-full mt-auto pb-2">
                <div className="flex justify-around">
                  <div className="w-6 h-6 rounded-full bg-white/30" />
                  <div className="w-6 h-6 rounded-full bg-white/30" />
                  <div className="w-6 h-6 rounded-full bg-white/50" />
                  <div className="w-6 h-6 rounded-full bg-white/30" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
