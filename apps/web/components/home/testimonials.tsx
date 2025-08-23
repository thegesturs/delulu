'use client';
import { Button } from '@delulu/design-system/components/ui/button';
import { cn } from '@delulu/design-system/lib/utils';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { FaCheck } from 'react-icons/fa';

const features = [
  'Prove your point to a stakeholder',
  'Validate a hypothesis',
  'Find topics you need to research',
];

const testimonials = [
  { image: '/images/kishore_gunnam.jpg', className: 'top-20 right-12' },
  { image: '/images/manu_arora.jpg', className: 'top-40 right-32' },
  { image: '/images/person3.png', className: 'top-60 right-16' },
  { image: '/images/person4.png', className: 'top-80 right-28' },
  { image: '/images/person5.png', className: 'top-96 right-20' },
  { image: '/images/person4.png', className: 'top-80 right-28' },
  { image: '/images/kishore_gunnam.jpg', className: 'top-20 right-12' },
  { image: '/images/manu_arora.jpg', className: 'top-40 right-32' },
];

export function Testimonials() {
  return (
    <section className="relative w-full overflow-hidden py-24">
      <div className="mx-auto max-w-7xl px-0 md:px-6">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          {/* Left Content */}
          <div className="space-y-8 px-4">
            <h2 className="font-semibold text-4xl">
              <span className="text-[#FF6B2B]">People</span> Love Us
            </h2>

            <p className="max-w-md text-lg text-neutral-600">
              People love us for our scheduling software. Even though they
              don&apis;t use it, we make sure to get a testimonial from them.
            </p>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#FF6B2B]/10">
                    <FaCheck className="h-3 w-3 text-[#FF6B2B]" />
                  </div>
                  <span className="text-neutral-700">{feature}</span>
                </div>
              ))}
            </div>

            <Button className="rounded-full bg-neutral-900 px-6 py-2.5 text-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-200 hover:bg-neutral-800" asChild>
              <Link href="https://solulu.delulu.social/sign-in">Get Started</Link>
            </Button>
          </div>

          {/* Right Side - Orbiting Avatars */}
          <div className="relative h-[600px] overflow-hidden">
            <OrbitingIcons
              centerIcon={
                <div className="z-20 flex items-center justify-center overflow-hidden rounded-[15px] border-[#F3F3F3] border-[1.5px] bg-gradient-to-br from-[#FBFBFB] via-[#FBFBFB] to-[#E8E8E8] p-4 shadow-[0px_123px_35px_0px_rgba(0,0,0,0.00),_0px_79px_32px_0px_rgba(0,0,0,0.01),_0px_44px_27px_0px_rgba(0,0,0,0.05),_0px_20px_20px_0px_rgba(0,0,0,0.09),_0px_5px_11px_0px_rgba(0,0,0,0.10)]">
                  <LightningIcon className="h-12 w-12" />
                </div>
              }
              orbits={[
                {
                  icons: testimonials.map((testimonial, index) => (
                    <div
                      key={index}
                      className="h-[120px] w-[120px] overflow-hidden rounded-[133px] bg-center bg-cover bg-gray-400 bg-no-repeat shadow-[0px_44px_12px_0px_rgba(0,0,0,0.00),_0px_28px_11px_0px_rgba(0,0,0,0.03),_0px_16px_10px_0px_rgba(0,0,0,0.11),_0px_7px_7px_0px_rgba(0,0,0,0.19),_0px_2px_4px_0px_rgba(0,0,0,0.22)]"
                    >
                      <Image
                        src={testimonial.image}
                        alt={`Testimonial ${index + 1}`}
                        width={220}
                        height={220}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )),
                  radius: 180,
                  speed: 25,
                },
              ]}
              className="ml-20 h-full w-full"
            />
            <div className="absolute inset-0 z-10 h-full w-full bg-gradient-to-l from-white via-white/50 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

const LightningIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      className={cn('h-6 w-6 text-[#FF6B2B]', className)}
      viewBox="0 0 49 67"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#filter0_di_966_1395)">
        <motion.path
          d="M37.6792 21.5018H29.1957C28.5839 21.5018 28.1155 20.9573 28.2069 20.3523L29.8985 9.16102C29.954 8.79514 29.9365 8.4203 29.8473 8.06263C29.758 7.70496 29.5991 7.37304 29.3817 7.08999C29.1643 6.80694 28.8935 6.57957 28.5883 6.42371C28.283 6.26785 27.9507 6.18724 27.6143 6.1875H15.6911C15.1436 6.18768 14.6139 6.4019 14.1961 6.7921C13.7783 7.18231 13.4995 7.72322 13.4092 8.31874L9.55125 33.8425C9.49578 34.2082 9.51322 34.5828 9.60233 34.9403C9.69145 35.2978 9.85012 35.6296 10.0673 35.9126C10.2845 36.1956 10.5549 36.423 10.8599 36.5791C11.1649 36.7351 11.497 36.816 11.8331 36.8161H20.0903C20.6426 36.8161 21.0903 37.2638 21.0903 37.8161V53.534C21.0903 54.5549 22.4401 54.9196 22.9542 54.0376L39.6278 25.435C39.8528 25.0493 39.9794 24.6038 39.9942 24.1455C40.0091 23.6871 39.9117 23.2328 39.7123 22.8303C39.5129 22.4278 39.2189 22.092 38.8611 21.8583C38.5033 21.6245 38.095 21.5013 37.6792 21.5018Z"
          fill="#D4611E"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 2,
            ease: 'easeInOut',
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
        <motion.path
          d="M37.6792 21.5018H29.1957C28.5839 21.5018 28.1155 20.9573 28.2069 20.3523L29.8985 9.16102C29.954 8.79514 29.9365 8.4203 29.8473 8.06263C29.758 7.70496 29.5991 7.37304 29.3817 7.08999C29.1643 6.80694 28.8935 6.57957 28.5883 6.42371C28.283 6.26785 27.9507 6.18724 27.6143 6.1875H15.6911C15.1436 6.18768 14.6139 6.4019 14.1961 6.7921C13.7783 7.18231 13.4995 7.72322 13.4092 8.31874L9.55125 33.8425C9.49578 34.2082 9.51322 34.5828 9.60233 34.9403C9.69145 35.2978 9.85012 35.6296 10.0673 35.9126C10.2845 36.1956 10.5549 36.423 10.8599 36.5791C11.1649 36.7351 11.497 36.816 11.8331 36.8161H20.0903C20.6426 36.8161 21.0903 37.2638 21.0903 37.8161V53.534C21.0903 54.5549 22.4401 54.9196 22.9542 54.0376L39.6278 25.435C39.8528 25.0493 39.9794 24.6038 39.9942 24.1455C40.0091 23.6871 39.9117 23.2328 39.7123 22.8303C39.5129 22.4278 39.2189 22.092 38.8611 21.8583C38.5033 21.6245 38.095 21.5013 37.6792 21.5018Z"
          fill="url(#paint0_linear_966_1395)"
          fillOpacity="0.7"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 2,
            ease: 'easeInOut',
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
      </g>
      <defs>
        <filter
          id="filter0_di_966_1395"
          x="0.519531"
          y="0.1875"
          width="48.4766"
          height="66.3482"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="3" />
          <feGaussianBlur stdDeviation="4.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.2 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_966_1395"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_966_1395"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="1.24444" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect2_innerShadow_966_1395"
          />
        </filter>
        <linearGradient
          id="paint0_linear_966_1395"
          x1="18.227"
          y1="2.45231"
          x2="56.1912"
          y2="37.6499"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFE0CF" />
          <stop offset="1" stopColor="#F68340" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const OrbitingIcons = ({
  centerIcon,
  orbits,
  className,
}: {
  centerIcon?: React.ReactNode;
  orbits: Array<{
    icons: React.ReactNode[];
    radius?: number;
    speed?: number;
    rotationDirection?: 'clockwise' | 'anticlockwise';
  }>;
  className?: string;
}) => {
  // Precalculate all orbit data
  const orbitData = React.useMemo(() => {
    return orbits.map((orbit, orbitIndex) => {
      const radius = orbit.radius || 100 + orbitIndex * 80;
      const speed = orbit.speed || 1;
      const iconCount = orbit.icons.length;

      // Calculate angles for each icon with even distribution
      const angleStep = 360 / iconCount;
      const angles = Array.from({ length: iconCount }, (_, i) => angleStep * i);

      // Precalculate positions and animations for each icon
      const iconData = angles.map((angle) => {
        const rotationAngle =
          orbit.rotationDirection === 'clockwise'
            ? [angle, angle - 360]
            : [angle, angle + 360];

        return {
          angle,
          rotationAngle,
          position: {
            x: radius * Math.cos((angle * Math.PI) / 180),
            y: radius * Math.sin((angle * Math.PI) / 180),
          },
          animation: {
            initial: {
              rotate: angle,
              scale: 1,
              opacity: 1,
            },
            animate: {
              rotate: rotationAngle,
              scale: 1,
              opacity: 1,
            },
            transition: {
              rotate: {
                duration: speed,
                repeat: Number.POSITIVE_INFINITY,
              },
            },
            counterRotation: {
              initial: { rotate: -angle },
              animate: {
                rotate:
                  orbit.rotationDirection === 'clockwise'
                    ? [-angle, -angle + 360]
                    : [-angle, -angle - 360],
              },
              transition: {
                duration: speed,
                repeat: Number.POSITIVE_INFINITY,
              },
            },
          },
        };
      });

      return {
        radius,
        speed,
        iconData,
        rotationDirection: orbit.rotationDirection,
      };
    });
  }, [orbits]);

  return (
    <div className={cn('relative', className)}>
      {centerIcon && (
        <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-20">
          {centerIcon}
        </div>
      )}
      {orbitData.map((orbit, orbitIndex) => (
        <div
          key={orbitIndex}
          className="absolute top-0 left-0 h-full w-full"
          style={{ zIndex: orbits.length - orbitIndex }}
        >
          <div
            className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 rounded-full"
            style={{
              width: orbit.radius * 2 + 'px',
              height: orbit.radius * 2 + 'px',
            }}
          />

          {orbit.iconData.map((icon, iconIndex) => (
            <motion.div
              key={iconIndex}
              className="absolute"
              style={{
                width: '40px',
                height: '40px',
                left: 'calc(50% - 20px)',
                top: 'calc(50% - 20px)',
                transformOrigin: 'center center',
              }}
              initial={icon.animation.initial}
              animate={icon.animation.animate}
              transition={icon.animation.transition}
            >
              <div
                style={{
                  position: 'absolute',
                  left: `${orbit.radius}px`,
                  transformOrigin: 'center center',
                }}
              >
                <motion.div
                  initial={icon.animation.counterRotation.initial}
                  animate={icon.animation.counterRotation.animate}
                  transition={icon.animation.counterRotation.transition}
                >
                  {orbits[orbitIndex].icons[iconIndex]}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
};
