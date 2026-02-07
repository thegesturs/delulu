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
};

export const DesignSystemProvider = ({
  children,
  privacyUrl,
  termsUrl,
  helpUrl,
  ...properties
}: DesignSystemProviderProperties) => {
  return (
    <ThemeProvider {...properties}>
      <AuthProvider
        helpUrl={helpUrl}
        privacyUrl={privacyUrl}
        termsUrl={termsUrl}
      >
        <AnalyticsProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </AnalyticsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
