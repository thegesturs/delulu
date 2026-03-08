"use client";

import type { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
  darkMode?: boolean;
  className?: string;
}

export function PhoneFrame({ children, darkMode = false, className }: PhoneFrameProps) {
  return (
    <div className={`flex items-center justify-center p-6 ${className ?? ""}`}>
      <div className="relative mx-auto w-[350px]">
        {/* Phone Frame */}
        <div className="relative rounded-[20px] border-8 border-black bg-black shadow-2xl">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 z-10 h-5 w-28 -translate-x-1/2 rounded-b-xl bg-black" />

          {/* Screen */}
          <div
            className={`relative h-[600px] overflow-hidden rounded-[8px] ${
              darkMode ? "bg-black" : "bg-white"
            }`}
          >
            {/* Status Bar */}
            <div
              className={`absolute top-0 z-20 flex h-10 w-full items-center justify-between px-4 ${
                darkMode ? "text-white/80" : "text-black/80"
              }`}
            >
              <span className="text-[11px] tracking-wide">9:41</span>
              <div className="flex items-center gap-1.5">
                <div
                  className={`h-[3px] w-5 rounded ${
                    darkMode ? "bg-white/70" : "bg-black/70"
                  }`}
                />
                <div
                  className={`h-[3px] w-5 rounded ${
                    darkMode ? "bg-white/70" : "bg-black/70"
                  }`}
                />
                <div
                  className={`h-[3px] w-5 rounded ${
                    darkMode ? "bg-white/70" : "bg-black/70"
                  }`}
                />
              </div>
            </div>

            {children}
          </div>
        </div>

        {/* Side Buttons */}
        <div className="absolute top-32 -right-3 h-8 w-1 rounded-r bg-black" />
        <div className="absolute top-48 -right-3 h-16 w-1 rounded-r bg-black" />
        <div className="absolute top-48 -left-3 h-16 w-1 rounded-l bg-black" />
      </div>
    </div>
  );
}
