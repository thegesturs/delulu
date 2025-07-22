import './styles.css';
import { TRPCReactProvider } from '@/trpc/react';
import { ConvexClientProvider } from '@delulu/auth/provider';
import { DesignSystemProvider } from '@delulu/design-system';
import { fonts } from '@delulu/design-system/lib/fonts';
import type { ReactNode } from 'react';

type RootLayoutProperties = {
  readonly children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html lang="en" className={fonts} suppressHydrationWarning>
    <body>
      <TRPCReactProvider>
        <ConvexClientProvider>
          <DesignSystemProvider>{children}</DesignSystemProvider>
        </ConvexClientProvider>
      </TRPCReactProvider>
    </body>
  </html>
);

export default RootLayout;
