import './styles.css';
import { TRPCReactProvider } from '@/trpc/react';
import { ConvexClientProvider } from '@delulu/auth/provider';
import { DesignSystemProvider } from '@delulu/design-system';
import { fonts } from '@delulu/design-system/lib/fonts';
import { Toolbar } from '@delulu/feature-flags/components/toolbar';
import type { ReactNode } from 'react';

type RootLayoutProperties = {
  readonly children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html lang="en" className={fonts} suppressHydrationWarning>
    <body>
      <ConvexClientProvider>
        <DesignSystemProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </DesignSystemProvider>
      </ConvexClientProvider>
      <Toolbar />
    </body>
  </html>
);

export default RootLayout;
