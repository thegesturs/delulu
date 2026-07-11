import { UserJot } from "@/components/analytics/userjot";
import { ApiClientProvider } from "@/components/providers/api-client";
import { ConvexClientProvider } from "@/components/providers/clerk-convex";
import { WorkspaceProvider } from "@/components/providers/workspace";
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
    <head>
      {process.env.NEXT_PUBLIC_AFFONSO_PROGRAM_ID && (
        <script
          async
          data-affonso={process.env.NEXT_PUBLIC_AFFONSO_PROGRAM_ID}
          data-cookie_duration="90"
          defer
          src="https://affonso.io/js/pixel.min.js"
        />
      )}
    </head>
    <body>
      <DesignSystemProvider
        privacyUrl="https://delulu.social/legal/privacy-policy"
        termsUrl="https://delulu.social/legal/terms-of-service"
      >
        <ConvexClientProvider>
          <TRPCReactProvider>
            <ApiClientProvider>
              <WorkspaceProvider>
                <NuqsAdapter>{children}</NuqsAdapter>
              </WorkspaceProvider>
            </ApiClientProvider>
          </TRPCReactProvider>
        </ConvexClientProvider>
      </DesignSystemProvider>
      <UserJot />
    </body>
  </html>
);

export default RootLayout;
