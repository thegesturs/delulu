'use client';

import { useIntl } from 'react-intl';

export const useTranslation = () => {
  const intl = useIntl();

  const t = (id: string, values?: Record<string, any>) => {
    return intl.formatMessage({ id }, values);
  };

  return { t, ...intl };
};