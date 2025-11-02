'use client';

import { useIntl } from 'react-intl';

export const useTranslation = () => {
  const intl = useIntl();

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const t = (key: string, values?: Record<string, any>) => {
    try {
      return intl.formatMessage({ id: key }, values);
    } catch (_error) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
  };

  return { t, locale: intl.locale };
};
