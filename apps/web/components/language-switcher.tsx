'use client';

import { useState } from 'react';
import { useLocale, LOCALES, type Locale } from '@/lib/i18n';
import { Globe } from 'lucide-react';

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
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
        aria-label="Choose language"
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{locale}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1 max-h-60 overflow-y-auto">
              {Object.entries(LOCALES).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => handleLocaleChange(code as Locale)}
                  className={`${
                    locale === code
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  } block w-full text-left px-4 py-2 text-sm transition-colors`}
                >
                  <span className="font-medium uppercase mr-3">{code}</span>
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