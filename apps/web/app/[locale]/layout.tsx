import './styles.css';
import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { DesignSystemProvider } from '@delulu/design-system';
import { fonts } from '@delulu/design-system/lib/fonts';
import { cn } from '@delulu/design-system/lib/utils';
import { getDictionary } from '@delulu/internationalization';
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

  return (
    <html
      lang="en"
      className={cn(fonts, 'scroll-smooth')}
      suppressHydrationWarning
    >
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
