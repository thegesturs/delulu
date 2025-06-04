'use client';
import { useMediaQuery } from '@delulu/design-system/hooks/use-media-query';
import { cn } from '@delulu/design-system/lib/utils';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import type React from 'react';
import { useRef } from 'react';
import Balancer from 'react-wrap-balancer';
import { Button } from './button';
import { IphoneMockup } from './iphone-mockup';
export function Hero() {
  const parentRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  return (
    <div
      ref={parentRef}
      className="relative mx-auto my-2 flex max-w-7xl flex-col items-center justify-center overflow-hidden rounded-b-3xl bg-gradient-to-t from-[rgba(79,70,229,0.1)] via-[rgba(244,244,255,1)] to-background px-4 pt-32 md:my-20 md:px-8"
    >
      <div className="relative z-20 mx-auto mb-4 max-w-6xl text-balance text-center font-semibold text-4xl text-gray-700 tracking-tight md:text-7xl">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={cn(
            'inline-block bg-gradient-to-b from-[rgba(67,56,202,1)] to-[rgba(49,46,129,1)]',
            'bg-clip-text text-transparent'
          )}
        >
          <Balancer>
            Effortless Call{' '}
            <span className="bg-gradient-to-b from-[rgba(99,102,241,1)] to-[rgba(79,70,229,1)] bg-clip-text text-transparent">
              Scheduling
            </span>
          </Balancer>
        </motion.h2>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={cn(
            'inline-block bg-gradient-to-b from-[rgba(67,56,202,1)] to-[rgba(49,46,129,1)]',
            'bg-clip-text py-2 text-transparent'
          )}
        >
          <Balancer>
            That Makes your Life{' '}
            <span className="bg-gradient-to-b from-[rgba(99,102,241,1)] to-[rgba(79,70,229,1)] bg-clip-text text-transparent">
              Easier
            </span>
          </Balancer>
        </motion.h2>
      </div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.5 }}
        className="relative z-20 mx-auto mt-4 max-w-2xl px-4 text-center text-base/6 text-indigo-900/70 sm:text-base"
      >
        Schedule calls with a single click. Go from no calls to your calendar
        filled with calls with ease using Shape AI, your favourite scheduling
        software.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.7 }}
        className="z-10 mt-6 mb-8 flex w-full flex-col items-center justify-center gap-4 px-4 sm:mt-8 sm:mb-10 sm:flex-row sm:px-8 md:mb-20"
      >
        <Button
          as={Link}
          href="/login"
          variant="primary"
          className="flex h-12 w-full items-center justify-center sm:w-40"
        >
          Get Started
        </Button>
      </motion.div>

      <div className="relative min-h-[21rem] w-full pt-[2rem]">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="absolute top-0 right-0 left-0 z-10"
        >
          <IphoneMockup>
            <MockScreen />
          </IphoneMockup>
        </motion.div>
        <BackgroundShape />
      </div>
    </div>
  );
}

function BackgroundShape({
  mobileBreakpoint = '(max-width: 768px)',
  sizes = {
    mobile: {
      outer: 800,
      middle: 600,
      inner: 400,
    },
    desktop: {
      outer: 1400,
      middle: 1100,
      inner: 800,
    },
  },
  animations = {
    middle: {
      scale: [1, 1.02, 1],
      y: [0, -5, 0],
      duration: 2,
    },
    inner: {
      scale: [1, 1.03, 1],
      y: [0, -7, 0],
      duration: 2.5,
    },
  },
  gradientColors = {
    start: 'rgba(255,255,255,1)',
    mid1: 'rgba(255,255,255,0.8)',
    mid2: 'rgba(255,255,255,0.4)',
    end: 'rgba(255,255,255,0)',
  },
}) {
  const isMobile = useMediaQuery(mobileBreakpoint);
  const { outer, middle, inner } = isMobile ? sizes.mobile : sizes.desktop;

  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center">
      <div
        className="absolute z-0 rounded-full border border-white/30"
        style={{
          width: outer,
          height: outer,
        }}
      />
      <motion.div
        className="absolute z-0 rounded-full border border-white"
        style={{
          width: middle,
          height: middle,
          clipPath: 'circle(50% at 50% 50%)',
          background: `
            radial-gradient(
              circle at center,
              ${gradientColors.start} 0%,
              ${gradientColors.mid1} 20%, 
              ${gradientColors.mid2} 40%,
              ${gradientColors.end} 60%
            )
          `,
        }}
        animate={{
          scale: animations.middle.scale,
          y: animations.middle.y,
        }}
        transition={{
          duration: animations.middle.duration,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
          times: [0, 0.5, 1],
        }}
      />
      <motion.div
        className="absolute z-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-white/5 shadow-[0_0_200px_80px_rgba(255,255,255,0.1)]"
        style={{
          width: inner,
          height: inner,
        }}
        animate={{
          scale: animations.inner.scale,
          y: animations.inner.y,
        }}
        transition={{
          duration: animations.inner.duration,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
          times: [0, 0.5, 1],
        }}
      />
    </div>
  );
}

const MockScreen = () => {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex w-full justify-between gap-2 p-2">
        <div className="flex gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M16.5 5V3M7.5 5V3M3.25 8H20.75M3 10.044C3 7.929 3 6.871 3.436 6.063C3.83025 5.34231 4.44199 4.7645 5.184 4.412C6.04 4 7.16 4 9.4 4H14.6C16.84 4 17.96 4 18.816 4.412C19.569 4.774 20.18 5.352 20.564 6.062C21 6.872 21 7.93 21 10.045V14.957C21 17.072 21 18.13 20.564 18.938C20.1698 19.6587 19.558 20.2365 18.816 20.589C17.96 21 16.84 21 14.6 21H9.4C7.16 21 6.04 21 5.184 20.588C4.44214 20.2358 3.83041 19.6583 3.436 18.938C3 18.128 3 17.07 3 14.955V10.044Z"
              stroke="#4A4A4A"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Schedule</span>
        </div>
        <div className="flex gap-2">
          <span> See all</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="24"
            viewBox="0 0 12 24"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10.1569 12.7116L4.49994 18.3686L3.08594 16.9546L8.03594 12.0046L3.08594 7.05463L4.49994 5.64062L10.1569 11.2976C10.3444 11.4852 10.4497 11.7395 10.4497 12.0046C10.4497 12.2698 10.3444 12.5241 10.1569 12.7116Z"
              fill="#4A4A4A"
            />
          </svg>
        </div>
      </div>

      <div className="w-full px-2 py-3">
        <div className="w-full rounded-xl bg-[#EEF2FF] p-2">
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-[#5D4037] text-md">
              Meeting with Kishore
            </h3>
            <button type="button" className="text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>

          <p className="mt-1 text-[#7B6B63] text-xs">8:00 AM - 9:00 AM</p>
          <div className="flex items-center justify-between gap-4">
            <div className="mt-4 flex flex-col items-start gap-1">
              <div className="-space-x-2 flex">
                <Image
                  src="/images/kishore_gunnam.jpg"
                  alt=""
                  className="h-8 w-8 rounded-full border-2 border-white"
                  height={32}
                  width={32}
                />
                <Image
                  src="/images/manu_arora.jpg"
                  alt=""
                  className="h-8 w-8 rounded-full border-2 border-white"
                  height={32}
                  width={32}
                />
                <Image
                  src="/images/person3.png"
                  alt=""
                  className="h-8 w-8 rounded-full border-2 border-white"
                  height={32}
                  width={32}
                />
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#E6D5CC]">
                  <span className="text-[#7B6B63] text-xs">2+</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#7B6B63] text-xs">on Gmeet</span>
              </div>
            </div>
            <span className="rounded-full bg-[#E6D5CC] px-3 py-1 text-[#7B6B63] text-sm">
              Marketing
            </span>
          </div>
        </div>
      </div>

      <div className="w-full px-2 py-3">
        <div className="w-full rounded-xl bg-[#E0E7FF] p-2">
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-[#5D4037] text-md">
              Meeting with Manu
            </h3>
            <button type="button" className="text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>

          <p className="mt-1 text-[#7B6B63] text-xs">8:00 AM - 9:00 AM</p>
          <div className="flex items-center justify-between gap-4">
            <div className="mt-4 flex flex-col items-start gap-1">
              <div className="-space-x-2 flex">
                <Image
                  src="/images/kishore_gunnam.jpg"
                  alt=""
                  className="h-8 w-8 rounded-full border-2 border-white"
                  height={32}
                  width={32}
                />
                <Image
                  src="/images/manu_arora.jpg"
                  alt=""
                  className="h-8 w-8 rounded-full border-2 border-white"
                  height={32}
                  width={32}
                />
                <Image
                  src="/images/person3.png"
                  alt=""
                  className="h-8 w-8 rounded-full border-2 border-white"
                  height={32}
                  width={32}
                />
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#E6D5CC]">
                  <span className="text-[#7B6B63] text-xs">2+</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#7B6B63] text-xs">on Gmeet</span>
              </div>
            </div>
            <span className="rounded-full bg-[#E6D5CC] px-3 py-1 text-[#7B6B63] text-sm">
              Marketing
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
