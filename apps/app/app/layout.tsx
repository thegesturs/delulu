import { ConvexClientProvider } from '@/components/providers/clerk-convex';
import './styles.css';
import { TRPCReactProvider } from '@/trpc/react';
import { DesignSystemProvider } from '@delulu/design-system';
import { fonts } from '@delulu/design-system/lib/fonts';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

type RootLayoutProperties = {
  readonly children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html lang="en" className={fonts} suppressHydrationWarning>
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
    </body>
  </html>
);

export default RootLayout;
