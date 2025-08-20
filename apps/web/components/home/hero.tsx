'use client';
// import { useTranslation } from '@/lib/useTranslation';
import { useTheme } from '@delulu/design-system';
import { Button } from '@delulu/design-system/components/ui/button';
import { useMediaQuery } from '@delulu/design-system/hooks/use-media-query';
import { cn } from '@delulu/design-system/lib/utils';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import type React from 'react';
import { useRef } from 'react';
import Balancer from 'react-wrap-balancer';
import { DesktopMockup } from './desktop-mockup';
import { AsciiBackground } from './ascii';

export function Hero() {
  // const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const image = isDark ? '/images/app-dark.png' : '/images/app-light.png';
  return (
    <div
      ref={parentRef}
      className="relative mx-auto my-2 flex max-w-7xl flex-col items-center justify-center overflow-hidden rounded-b-3xl px-4 pt-32 md:my-20 md:px-8"
    >
      <AsciiBackground
        intensity="medium"
        speed="slow"
        opacity={0.8}
        className="z-0"
      />
      <div className="relative z-20 mx-auto mb-4 max-w-6xl text-balance text-center font-semibold text-4xl tracking-tight md:text-7xl">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={cn(
            'inline-block bg-gradient-to-b from-foreground/90 to-foreground',
            'bg-clip-text text-transparent'
          )}
        >
          <Balancer>Delulu Social</Balancer>
        </motion.h2>
      </div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.5 }}
        className="relative z-20 mx-auto mt-4 max-w-2xl px-4 text-center text-base/6 text-muted-foreground sm:text-base"
      >
        Manage all your social media platforms in one place. Create, schedule,
        and publish content across Instagram, Facebook, Twitter, LinkedIn,
        TikTok, Pinterest, and more.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.7 }}
        className="z-10 mt-6 mb-8 flex w-full flex-col items-center justify-center gap-4 px-4 sm:mt-8 sm:mb-10 sm:flex-row sm:px-8 md:mb-20"
      >
        <Button asChild>
          <Link href="/login">Get Started</Link>
        </Button>
      </motion.div>

      <div className="relative min-h-[21rem] w-full pt-[2rem]">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="absolute top-0 right-0 left-0 z-10"
        >
          <DesktopMockup>
            <Image
              src={image}
              alt="Delulu Social"
              width={1000}
              height={1000}
              className="h-full w-full object-contain object-top"
            />
          </DesktopMockup>
        </motion.div>
        {/* <BackgroundShape /> */}
      </div>
    </div>
  );
}

// function BackgroundShape({
//   mobileBreakpoint = '(max-width: 768px)',
//   sizes = {
//     mobile: {
//       outer: 800,
//       middle: 600,
//       inner: 400,
//     },
//     desktop: {
//       outer: 1400,
//       middle: 1100,
//       inner: 800,
//     },
//   },
//   animations = {
//     middle: {
//       scale: [1, 1.02, 1],
//       y: [0, -5, 0],
//       duration: 2,
//     },
//     inner: {
//       scale: [1, 1.03, 1],
//       y: [0, -7, 0],
//       duration: 2.5,
//     },
//   },
//   gradientColors = {
//     start: 'var(--background)',
//     mid1: 'var(--background)',
//     mid2: 'var(--background)',
//     end: 'transparent',
//   },
// }) {
//   const isMobile = useMediaQuery(mobileBreakpoint);
//   const { outer, middle, inner } = isMobile ? sizes.mobile : sizes.desktop;

//   return (
//     <div className="absolute inset-0 z-0 flex items-center justify-center">
//       <div
//         className="absolute z-0 rounded-full border border-foreground/10"
//         style={{
//           width: outer,
//           height: outer,
//         }}
//       />
//       <motion.div
//         className="absolute z-0 rounded-full border border-foreground/10"
//         style={{
//           width: middle,
//           height: middle,
//           clipPath: 'circle(50% at 50% 50%)',
//           background: `
//             radial-gradient(
//               circle at center,
//               ${gradientColors.start} 0%,
//               ${gradientColors.mid1} 10%, 
//               ${gradientColors.mid2} 20%,
//               ${gradientColors.end} 20%
//             )
//           `,
//         }}
//         animate={{
//           scale: animations.middle.scale,
//           y: animations.middle.y,
//         }}
//         transition={{
//           duration: animations.middle.duration,
//           repeat: Number.POSITIVE_INFINITY,
//           ease: 'easeInOut',
//           times: [0, 0.5, 1],
//         }}
//       />
//       <motion.div
//         className="absolute z-2 rounded-full border border-foreground/10 bg-background/10"
//         style={{
//           width: inner,
//           height: inner,
//         }}
//         animate={{
//           scale: animations.inner.scale,
//           y: animations.inner.y,
//         }}
//         transition={{
//           duration: animations.inner.duration,
//           repeat: Number.POSITIVE_INFINITY,
//           ease: 'easeInOut',
//           times: [0, 0.5, 1],
//         }}
//       />
//     </div>
//   );
// }
