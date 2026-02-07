"use client";

import { Globe } from "lucide-react";
import { useState } from "react";
import { LOCALES, type Locale, useLocale } from "@/lib/i18n";

export const LanguageSwitcher = () => {
  const { locale, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        aria-label="Choose language"
        className="flex items-center gap-2 rounded-md px-3 py-2 font-medium text-gray-700 text-sm hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{locale}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          {/* biome-ignore lint/nursery/noStaticElementInteractions: <explanation> */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setIsOpen(false);
              }
            }}
          />

          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="max-h-60 overflow-y-auto py-1">
              {Object.entries(LOCALES).map(([code, name]) => (
                <button
                  className={`${
                    locale === code
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  } block w-full px-4 py-2 text-left text-sm transition-colors`}
                  key={code}
                  onClick={() => handleLocaleChange(code as Locale)}
                  type="button"
                >
                  <span className="mr-3 font-medium uppercase">{code}</span>
                  {name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
