import { UserJot } from "@/components/analytics/userjot";
import { ConvexClientProvider } from "@/components/providers/clerk-convex";
import "./styles.css";
import { DesignSystemProvider } from "@delulu/design-system";
import { fonts } from "@delulu/design-system/lib/fonts";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { TRPCReactProvider } from "@/trpc/react";

interface RootLayoutProperties {
  readonly children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html className={fonts} lang="en" suppressHydrationWarning>
    <body>
      <DesignSystemProvider
        privacyUrl="https://delulu.social/legal/privacy-policy"
        termsUrl="https://delulu.social/legal/terms-of-service"
      >
        <ConvexClientProvider>
          <TRPCReactProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
          </TRPCReactProvider>
        </ConvexClientProvider>
      </DesignSystemProvider>
      <UserJot />
    </body>
  </html>
);

export default RootLayout;
