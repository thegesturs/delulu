import { env } from 'env';
import './styles.css';
import { StoreProvider } from '@/providers/store-provider';
import { TRPCReactProvider } from '@/trpc/react';
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
      <DesignSystemProvider
        privacyUrl={new URL(
          '/legal/privacy',
          env.NEXT_PUBLIC_WEB_URL
        ).toString()}
        termsUrl={new URL('/legal/terms', env.NEXT_PUBLIC_WEB_URL).toString()}
        helpUrl={env.NEXT_PUBLIC_DOCS_URL}
      >
        <TRPCReactProvider>
          <StoreProvider>{children}</StoreProvider>
        </TRPCReactProvider>
      </DesignSystemProvider>
      <Toolbar />
    </body>
  </html>
);

export default RootLayout;
