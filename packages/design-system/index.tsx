import { AnalyticsProvider } from '@delulu/analytics';
import type { ThemeProviderProps } from 'next-themes';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { ThemeProvider } from './providers/theme';
export { useTheme } from 'next-themes';

export const DesignSystemProvider = ({
  children,
  ...properties
}: ThemeProviderProps) => {
  return (
    <ThemeProvider {...properties}>
      <AnalyticsProvider>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </AnalyticsProvider>
    </ThemeProvider>
  );
};
