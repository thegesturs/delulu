import './styles.css';
import { ConvexClientProvider } from '@/components/providers/clerk-convex';
import { TRPCReactProvider } from '@/trpc/react';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { DesignSystemProvider } from '@delulu/design-system';
import { fonts } from '@delulu/design-system/lib/fonts';
import type { ReactNode } from 'react';

type RootLayoutProperties = {
  readonly children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html lang="en" className={fonts} suppressHydrationWarning>
    <body>
      <ClerkProvider
        appearance={{
          baseTheme: dark,
        }}
      >
        <ConvexClientProvider>
          <DesignSystemProvider>
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </DesignSystemProvider>
        </ConvexClientProvider>
      </ClerkProvider>
    </body>
  </html>
);

export default RootLayout;
