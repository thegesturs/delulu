import './styles.css';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { env } from '@/env';
import { DesignSystemProvider } from '@delulu/design-system';
import { fonts } from '@delulu/design-system/lib/fonts';
import { cn } from '@delulu/design-system/lib/utils';
import {
  JsonLd,
  createAISoftwareApplicationSchema,
  createOrganizationSchema,
  createWebSiteSchema,
} from '@delulu/seo/json-ld';
import { createMetadata } from '@delulu/seo/metadata';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

type RootLayoutProperties = {
  readonly children: ReactNode;
};

export const metadata: Metadata = createMetadata({
  title: 'Delulu Social',
  description:
    'Social media management platform for creating and publishing content across multiple social networks',
  image: '/images/logo.png',
  alternates: {
    canonical: `${env.NEXT_PUBLIC_WEB_URL || 'https://delulu.social'}`,
  },
});

const RootLayout = ({ children }: RootLayoutProperties) => {
  const baseUrl = env.NEXT_PUBLIC_WEB_URL || 'https://delulu.social';

  return (
    <html
      lang="en"
      className={cn(fonts, 'scroll-smooth')}
      suppressHydrationWarning
    >
      <head>
        <JsonLd code={createOrganizationSchema(baseUrl)} />
        <JsonLd code={createWebSiteSchema(baseUrl)} />
        <JsonLd code={createAISoftwareApplicationSchema(baseUrl)} />
      </head>
      <body>
        <DesignSystemProvider>
          <Navbar />
          {children}
          <Footer />
        </DesignSystemProvider>
        {/* <Toolbar /> */}
      </body>
    </html>
  );
};

export default RootLayout;
