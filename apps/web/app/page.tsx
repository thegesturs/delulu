import { createMetadata } from '@delulu/seo/metadata';
import type { Metadata } from 'next';

import CTA from '@/components/home/cta';
import { FAQ } from '@/components/home/faq';
import { Hero } from '@/components/home/hero';
import { MascotBenefits } from '@/components/home/mascot-benefits';
import { MascotStruggle } from '@/components/home/mascot-struggle';
import Pricing from '@/components/home/pricing';

export const generateMetadata = (): Metadata => {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://delulu.social';
  const ogImage = `${baseUrl}/api/og?title=${encodeURIComponent('Delulu Social - Social Media Management Platform')}&description=${encodeURIComponent('Manage all your social media platforms in one place. Create, schedule, and publish content across Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, and more.')}`;

  return createMetadata({
    title: 'Delulu Social - Social Media Management Platform',
    description:
      'Manage all your social media platforms in one place. Create, schedule, and publish content across Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, and more.',
    image: ogImage,
    openGraph: {
      title: 'Delulu Social - Social Media Management Platform',
      description:
        'Manage all your social media platforms in one place. Create, schedule, and publish content across Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, and more.',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: 'Delulu Social Platform',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Delulu Social - Social Media Management Platform',
      description:
        'Manage all your social media platforms in one place. Create, schedule, and publish content across Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, and more.',
      images: [ogImage],
    },
  });
};

const Home = () => {
  return (
    <main className="mx-auto max-w-7xl border-x">
      <Hero />
      <MascotStruggle />
      <MascotBenefits />
      {/* <MascotSocialProof /> */}
      <Pricing />
      <FAQ />
      <CTA />
    </main>
  );
};

export default Home;
