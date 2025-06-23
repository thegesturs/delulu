'use client';

import { type ReactNode, createContext, useContext } from 'react';
import { IntlProvider } from 'react-intl';

// Supported locales
export const LOCALES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  zh: '中文',
  pt: 'Português',
  it: 'Italiano',
  ru: 'Русский',
  ko: '한국어',
  ar: 'العربية',
} as const;

export type Locale = keyof typeof LOCALES;

// Context for locale management
interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};

interface LocaleProviderProps {
  children: ReactNode;
  locale: Locale;
  messages: Record<string, any>;
  onLocaleChange?: (locale: Locale) => void;
}

export const LocaleProvider = ({
  children,
  locale,
  messages,
  onLocaleChange,
}: LocaleProviderProps) => {
  const setLocale = (newLocale: Locale) => {
    onLocaleChange?.(newLocale);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <IntlProvider
        locale={locale}
        messages={messages}
        defaultLocale="en"
        onError={() => {}} // Suppress missing translation warnings in production
      >
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
};

// Utility function to load messages
export const loadMessages = async (
  locale: Locale
): Promise<Record<string, any>> => {
  try {
    const messages = await import(`../locales/${locale}.json`);
    return messages.default || messages;
  } catch (error) {
    console.warn(
      `Failed to load messages for locale: ${locale}, falling back to English`
    );
    const fallback = await import('../locales/en.json');
    return fallback.default || fallback;
  }
};

// Get browser locale or default to English
export const getBrowserLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en';

  const browserLocale = navigator.language.split('-')[0] as Locale;
  return Object.keys(LOCALES).includes(browserLocale) ? browserLocale : 'en';
};

// Get locale from URL or browser
export const getInitialLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en';

  // Check URL params first
  const urlParams = new URLSearchParams(window.location.search);
  const urlLocale = urlParams.get('lang') as Locale;
  if (urlLocale && Object.keys(LOCALES).includes(urlLocale)) {
    return urlLocale;
  }

  // Check localStorage
  const savedLocale = localStorage.getItem('locale') as Locale;
  if (savedLocale && Object.keys(LOCALES).includes(savedLocale)) {
    return savedLocale;
  }

  // Fall back to browser locale
  return getBrowserLocale();
};
