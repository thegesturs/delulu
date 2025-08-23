'use client';
import { useTheme } from '@delulu/design-system';
import { Button } from '@delulu/design-system/components/ui/button';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import type React from 'react';
import { useRef } from 'react';
import Balancer from 'react-wrap-balancer';
import { DesktopMockup } from './desktop-mockup';
import { GradientBars } from './gradient-bars';

export function Hero() {
  const parentRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const image = isDark ? '/images/app-dark.png' : '/images/app-light.png';

  return (
    <div
      ref={parentRef}
      className="relative mx-auto flex max-w-7xl flex-col items-center justify-center overflow-hidden px-4 pt-40 md:px-8"
    >
      {/* Shader Background */}
      <div className="absolute inset-0">
        <GradientBars
          bars={20}
          colors={[theme === 'dark' ? '#818cf8' : '#4338ca', 'transparent']}
        />
      </div>

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-4xl text-center">
        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 font-bold text-5xl text-foreground tracking-tight md:text-7xl"
        >
          <Balancer>Posting everywhere sucks. We fixed it.</Balancer>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 md:text-xl"
        >
          <Balancer>
            You know the drill: copy → paste → resize → upload → repeat.
            Instagram wants vertical. LinkedIn wants text-heavy. YouTube wants
            captions. TikTok wants vibes. And suddenly, your “quick post” just
            ate your entire afternoon. Delulu Social kills that nightmare.
          </Balancer>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button asChild size="lg">
            <Link href="https://solulu.delulu.social/sign-in">
              👉 Fine, save me the headache
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="#features">Naah, bro show me more</Link>
          </Button>
        </motion.div>

        {/* Tiny Reassurance */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mx-auto mb-16 max-w-md text-sm text-zinc-500"
        >
          <Balancer>
            Chill. We don't spam. We don't sell your data. We don't even want
            your phone number — ew.
          </Balancer>
        </motion.p>
      </div>

      {/* App Preview */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative z-10 mb-[-100px] w-full max-w-5xl"
      >
        <DesktopMockup>
          <Image
            src={image}
            alt="Delulu Social Dashboard"
            width={1200}
            height={800}
            className="h-full w-full object-contain object-top"
            priority
          />
          {/* Sarcastic Text Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="rounded-lg bg-black/80 px-6 py-3 text-center text-white backdrop-blur-sm"
            >
              <p className="font-medium text-lg">Look, mom, one click.</p>
            </motion.div>
          </div>
        </DesktopMockup>
      </motion.div>
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
