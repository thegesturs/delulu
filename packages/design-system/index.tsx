import { AnalyticsProvider } from '@delulu/analytics';
import { AuthProvider } from '@delulu/auth/provider';
import type { ThemeProviderProps } from 'next-themes';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { ThemeProvider } from './providers/theme';
export { useTheme } from 'next-themes';

type DesignSystemProviderProperties = ThemeProviderProps & {
  privacyUrl?: string;
  termsUrl?: string;
  helpUrl?: string;
  withAuth?: boolean;
};

export const DesignSystemProvider = ({
  children,
  privacyUrl,
  termsUrl,
  helpUrl,
  withAuth = true,
  ...properties
}: DesignSystemProviderProperties) => {
  const content = (
    <AnalyticsProvider>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster />
    </AnalyticsProvider>
  );

  return (
    <ThemeProvider {...properties}>
      {withAuth ? (
        <AuthProvider privacyUrl={privacyUrl} termsUrl={termsUrl} helpUrl={helpUrl}>
          {content}
        </AuthProvider>
      ) : (
        content
      )}
    </ThemeProvider>
  );
};
