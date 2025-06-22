'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { LocaleProvider, loadMessages, getInitialLocale, type Locale } from '@/lib/i18n';

interface ClientLocaleProviderProps {
  children: ReactNode;
}

export const ClientLocaleProvider = ({ children }: ClientLocaleProviderProps) => {
  const [locale, setLocale] = useState<Locale>('en');
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const [messages, setMessages] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initLocale = async () => {
      const initialLocale = getInitialLocale();
      const initialMessages = await loadMessages(initialLocale);
      
      setLocale(initialLocale);
      setMessages(initialMessages);
      setIsLoading(false);
    };

    initLocale();
  }, []);

  const handleLocaleChange = async (newLocale: Locale) => {
    setIsLoading(true);
    
    try {
      const newMessages = await loadMessages(newLocale);
      setLocale(newLocale);
      setMessages(newMessages);
      
      // Save to localStorage
      localStorage.setItem('locale', newLocale);
      
      // Update URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.set('lang', newLocale);
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      console.error('Failed to change locale:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <LocaleProvider
      locale={locale}
      messages={messages}
      onLocaleChange={handleLocaleChange}
    >
      {children}
    </LocaleProvider>
  );
};