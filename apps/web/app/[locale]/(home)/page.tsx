// import { showBetaFeature } from '@delulu/feature-flags';
// import { getDictionary } from '@delulu/internationalization';
import { createMetadata } from '@delulu/seo/metadata';
import type { Metadata } from 'next';
// import { Cases } from './components/cases';
// import { CTA } from './components/cta';
// import { FAQ } from './components/faq';
// import { Features } from './components/features';
// import { Hero } from './components/hero';
// import { Stats } from './components/stats';
// import { Testimonials } from './components/testimonials';

import CTA from '@/components/cta';
import { FAQ } from '@/components/faq';
import { Features } from '@/components/features';
import { Features2 } from '@/components/features2';
import Features3 from '@/components/features3';
import { Hero } from '@/components/hero';
import { LogoCloud } from '@/components/logos-cloud';
import Pricing from '@/components/pricing';
import { getDictionary } from '@delulu/internationalization';

type HomeProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: HomeProps): Promise<Metadata> => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://delulu.social';
  const ogImage = `${baseUrl}/api/og?title=${encodeURIComponent('Delulu Social - Social Media Management Platform')}&description=${encodeURIComponent('Manage all your social media platforms in one place. Create, schedule, and publish content across Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, and more.')}`;

  return createMetadata({
    ...dictionary.web.home.meta,
    image: ogImage,
    openGraph: {
      title: 'Delulu Social - Social Media Management Platform',
      description: 'Manage all your social media platforms in one place. Create, schedule, and publish content across Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, and more.',
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'Delulu Social Platform' }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Delulu Social - Social Media Management Platform',
      description: 'Manage all your social media platforms in one place. Create, schedule, and publish content across Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, and more.',
      images: [ogImage],
    },
  });
};

const Home = () => {
  // const { locale } = await params;
  // const dictionary = await getDictionary(locale);
  // const betaFeature = await showBetaFeature();

  return (
    <>
      {/* {betaFeature && (
        <div className="w-full bg-black py-2 text-center text-white">
          Beta feature now available
        </div>
      )}
      <Hero dictionary={dictionary} />
      <Cases dictionary={dictionary} />
      <Features dictionary={dictionary} />
      <Stats dictionary={dictionary} />
      <Testimonials dictionary={dictionary} />
      <FAQ dictionary={dictionary} />
      <CTA dictionary={dictionary} /> */}
      <Hero />
      <LogoCloud />
      <Features />
      <Features2 />
      <Features3 />
      <Pricing />
      {/* <Testimonials /> */}
      <FAQ />
      <CTA />
    </>
  );
};

export default Home;
