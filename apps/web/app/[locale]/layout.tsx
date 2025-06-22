import './styles.css';
import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { DesignSystemProvider } from '@delulu/design-system';
import { fonts } from '@delulu/design-system/lib/fonts';
import { cn } from '@delulu/design-system/lib/utils';
import { getDictionary } from '@delulu/internationalization';
import { 
  JsonLd, 
  createOrganizationSchema, 
  createWebSiteSchema, 
  createSoftwareApplicationSchema 
} from '@delulu/seo/json-ld';
import { env } from '@/env';
import type { ReactNode } from 'react';

type RootLayoutProperties = {
  readonly children: ReactNode;
  readonly params: Promise<{
    locale: string;
  }>;
};

const RootLayout = async ({ children, params }: RootLayoutProperties) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
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
        <JsonLd code={createSoftwareApplicationSchema(baseUrl)} />
      </head>
      <body>
        <DesignSystemProvider>
          {/* <Header dictionary={dictionary} /> */}
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
