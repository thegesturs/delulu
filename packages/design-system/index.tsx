import { AnalyticsProvider } from "@delulu/analytics";
import type { ThemeProviderProps } from "next-themes";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./providers/theme";

export { useTheme } from "next-themes";

import { AuthProvider } from "@delulu/auth/provider";

type DesignSystemProviderProperties = ThemeProviderProps & {
  privacyUrl?: string;
  termsUrl?: string;
  helpUrl?: string;
  /** Surface for analytics attribution (`"app" | "web"`). */
  platform?: string;
};

export const DesignSystemProvider = ({
  children,
  privacyUrl,
  termsUrl,
  helpUrl,
  platform,
  ...properties
}: DesignSystemProviderProperties) => {
  return (
    <ThemeProvider {...properties}>
      <AuthProvider
        helpUrl={helpUrl}
        privacyUrl={privacyUrl}
        termsUrl={termsUrl}
      >
        <AnalyticsProvider platform={platform}>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </AnalyticsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
