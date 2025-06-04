'use client';

import { cn } from '@delulu/design-system/lib/utils';
import DottedMap from 'dotted-map';
import { motion } from 'motion/react';
import Image from 'next/image';
import React, { useMemo } from 'react';
import {
  FaArrowCircleLeft,
  FaDiscord,
  FaFacebook,
  FaLinkedin,
  FaReddit,
  FaTwitch,
  FaTwitter,
  FaYoutube,
} from 'react-icons/fa';
import { Logo, LogoIcon } from './logo';

export function Features2() {
  return (
    <div
      id="product"
      className="mx-auto w-full max-w-7xl px-4 py-4 md:my-20 md:px-8 md:py-20"
    >
      <div className="mb-16 text-center">
        <h2 className="mb-4 font-bold text-4xl md:text-6xl">
          Features so good you&apos;ll{' '}
          <span className="text-[#FF7757]">Love us</span>
        </h2>
        <p className="mx-auto max-w-2xl text-gray-500">
          Packed with thousands of features, we are going to show you only 4
          because bento looks the best with that
        </p>
      </div>
      <div className="cols-1 mx-auto mt-20 grid max-w-3xl auto-rows-[25rem] gap-4 lg:max-w-none lg:grid-cols-5">
        <Card className="relative flex flex-col justify-between lg:col-span-3">
          <div className="absolute inset-0">
            <MapView />
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 h-[70%] bg-gradient-to-t from-white via-white to-transparent" />
          <CardContent className="absolute bottom-0 z-10">
            <CardTitle>Connect with people all over the world</CardTitle>
            <CardDescription>
              Our servers are available all over the world except Asia,
              Australia, Europe, North America, South America and Africa.
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="relative flex flex-col justify-between lg:col-span-2">
          <Chart />
          <div className="absolute inset-x-0 bottom-0 z-10 h-[40%] bg-gradient-to-t from-white via-white to-transparent" />
          <CardContent className="absolute bottom-0 z-10">
            <CardTitle>Superb Analytics</CardTitle>
            <CardDescription>
              With our realtime dashboards, get a view of who&apos;s using your
              links and sending it to other people.
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="relative flex flex-col justify-between bg-transparent lg:col-span-2">
          <div className="absolute inset-0 flex items-center justify-center">
            <LogoOrbit />
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 h-[70%] bg-gradient-to-t from-white via-white to-transparent" />
          <CardContent className="absolute bottom-0 z-10">
            <CardTitle>Fancy ecosystem</CardTitle>
            <CardDescription>
              Connects with every other automation tool out there, zapier, meta
              you name it.
            </CardDescription>
          </CardContent>
          <div className="absolute right-4 bottom-4 opacity-10 md:opacity-100" />
        </Card>

        <Card className="flex flex-col justify-between lg:col-span-3">
          <CardSkeletonBody>
            <div className="mt-6 h-full w-full rounded-lg p-4 px-2 md:px-10">
              <DashboardCard />
            </div>
          </CardSkeletonBody>
          <CardContent className="h-40">
            <CardTitle>Easy to use</CardTitle>
            <CardDescription>We spend 90% of our budget on UX.</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const SkeletonTwo = () => {
  return (
    <div className="relative mt-10 flex h-60 flex-col items-center bg-transparent md:h-60" />
  );
};

// Card structure
const CardSkeletonBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      {children}
    </div>
  );
};

const CardContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn('p-6', className)}>{children}</div>;
};

const CardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h3
      className={cn(
        'inline-block font-[500] font-rubik text-[22px] text-black leading-[31px]',
        className
      )}
    >
      {children}
    </h3>
  );
};
const CardDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p
      className={cn(
        'mt-2 max-w-sm font-normal font-sans text-neutral-400 text-sm tracking-tight',
        className
      )}
    >
      {children}
    </p>
  );
};

const Card = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      whileHover="animate"
      className={cn(
        'group !bg-[#F9FAFB] relative isolate flex flex-col overflow-hidden rounded-2xl shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]',
        className
      )}
    >
      {children}
    </motion.div>
  );
};

const MapView = () => {
  const svgMap = useMemo(() => {
    const map = new DottedMap({
      height: 40,
      grid: 'diagonal',
    });

    return map.getSVG({
      radius: 0.15,
      color: '#000000',
      shape: 'circle',
    });
  }, []);

  const people = [
    {
      name: 'Kishore',
      x: '10%',
      y: '4%',
      photo: '/images/kishore_gunnam.jpg',
    },
    {
      name: 'John',
      x: '65%',
      y: '35%',
      photo: '/images/person3.png',
    },
    {
      name: 'Manu',
      x: '50%',
      y: '20%',
      photo: '/images/manu_arora.jpg',
    },
    {
      name: 'James',
      x: '80%',
      y: '25%',
      photo: '/images/person4.png',
    },
    {
      name: 'Emily',
      x: '30%',
      y: '45%',
      photo: '/images/person5.png',
    },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 transition-opacity duration-300">
        <Image
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
          className="-right-2 -mt-14 pointer-events-none absolute top-0 h-full w-full select-none object-cover opacity-50 [mask-image:linear-gradient(to_bottom,transparent,white_15%,white_85%,transparent)]"
          alt="Interactive world map visualization"
          height={595}
          width={356}
          priority={true}
          draggable={false}
        />
      </div>

      <div className="absolute inset-0">
        {people.map((person, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              left: person.x,
              top: person.y,
            }}
          >
            <Image
              src={person.photo}
              alt={person.name}
              width={40}
              height={40}
              className="rounded-full border-2 border-white shadow-lg"
            />
            <div className="-bottom-8 -translate-x-1/2 absolute left-1/2 rounded-lg border-[1.5px] border-white/40 bg-[#103685] px-2 py-1 text-white text-xs mix-blend-luminosity shadow-[0px_10px_15px_-6px_#000,0px_4px_6px_-4px_rgba(0,0,0,0.10),0px_0px_8px_0px_rgba(248,248,248,0.25)_inset,0px_32px_24px_-16px_rgba(0,0,0,0.40)] backdrop-blur-[6px]">
              {person.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Chart = () => {
  return (
    <div className="m-4 mx-auto w-full max-w-[290px] rounded-[18px_18px_0px_0px] border border-[#E1E1E1] border-[0.4px] bg-white p-2 shadow-[0px_37px_10px_0px_rgba(0,0,0,0.00),0px_24px_10px_0px_rgba(0,0,0,0.01),0px_13px_8px_0px_rgba(0,0,0,0.02),0px_6px_6px_0px_rgba(0,0,0,0.03),0px_1px_3px_0px_rgba(0,0,0,0.04)]">
      {/* Window Controls */}
      <div className="mb-8 flex gap-2">
        <div className="h-3 w-3 cursor-pointer rounded-full bg-[#FF5F57] hover:opacity-80" />
        <div className="h-3 w-3 cursor-pointer rounded-full bg-[#FEBC2E] hover:opacity-80" />
        <div className="h-3 w-3 cursor-pointer rounded-full bg-[#28C840] hover:opacity-80" />
      </div>

      {/* Chart Container */}
      <div className="relative mx-auto h-[200px] w-[260px]">
        {/* Chart Bars */}
        <div className="absolute top-0 right-0 bottom-16 left-0 flex h-[190px] items-end justify-between gap-4">
          {/* Cursor Line */}
          <div className="h-[30%] w-full cursor-pointer rounded-t-[15px] bg-[linear-gradient(180deg,#BFBFBF_0%,#FFF_100%),linear-gradient(90deg,#D9D9D9_0%,#737373_100%)] transition-opacity hover:opacity-80" />
          <div className="h-[70%] w-full cursor-pointer rounded-t-[15px] bg-[linear-gradient(180deg,#BFBFBF_0%,#FFF_100%),linear-gradient(90deg,#D9D9D9_0%,#737373_100%)] transition-opacity hover:opacity-80" />
          <div className="h-[40%] w-full cursor-pointer rounded-t-[15px] bg-[linear-gradient(180deg,#BFBFBF_0%,#FFF_100%),linear-gradient(90deg,#D9D9D9_0%,#737373_100%)] transition-opacity hover:opacity-80" />
          <div className="h-[80%] w-full cursor-pointer rounded-t-[15px] bg-[linear-gradient(180deg,#BFBFBF_0%,#FFF_100%),linear-gradient(90deg,#D9D9D9_0%,#737373_100%)] transition-opacity hover:opacity-80" />
          <div className="h-[50%] w-full cursor-pointer rounded-t-[15px] bg-[linear-gradient(180deg,#BFBFBF_0%,#FFF_100%),linear-gradient(90deg,#D9D9D9_0%,#737373_100%)] transition-opacity hover:opacity-80" />
          <div className="relative h-[100%] w-full cursor-pointer rounded-t-[15px] bg-[linear-gradient(180deg,#FEA353_0%,#FFF_100%),linear-gradient(90deg,#D9D9D9_0%,#737373_100%)] transition-opacity hover:opacity-90" />
        </div>

        {/* User Labels */}
        <motion.div
          className="-left-10 absolute top-10"
          initial={{ x: -20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          whileHover={{ x: 5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <div className="flex cursor-none items-center gap-2 rounded-lg border border-white/40 bg-[#103685] px-4 py-1.5 text-sm text-white mix-blend-luminosity shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset,0px_32px_24px_-16px_rgba(0,0,0,0.40)] backdrop-blur-[6px] transition-opacity hover:opacity-90">
              Manu
              <CursorIcon className="-top-4 -right-4 absolute" />
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="-bottom-4 -left-10 -right-10 absolute flex items-center justify-between gap-4 rounded-full border border-neutral-200 bg-white p-1">
          <div />
          <button
            type="button"
            className="cursor-pointer rounded-[37px] bg-[linear-gradient(181deg,#5E5E5E_18.12%,#000_99.57%)] px-6 py-2 text-right text-white shadow-[0px_1px_1px_2px_rgba(255,255,255,0.40)_inset,0px_-1px_5px_2px_rgba(255,255,255,0.40)_inset,0px_10px_20px_0px_rgba(0,0,0,0.10),0px_3px_6px_0px_rgba(0,0,0,0.05),0px_4px_8px_0px_rgba(3,7,18,0.06),0px_2px_4px_0px_rgba(3,7,18,0.06),0px_0px_0px_1px_rgba(3,7,18,0.08)]"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

const CursorIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="21"
      viewBox="0 0 22 21"
      fill="none"
      className={className}
    >
      <path
        d="M16.9492 2.29758C17.135 2.22487 17.3235 2.15109 17.4831 2.10476C17.6345 2.06081 17.9271 1.98678 18.246 2.08721C18.6115 2.20235 18.904 2.4788 19.0396 2.83725C19.1578 3.14991 19.1004 3.44625 19.0651 3.59991C19.0278 3.76189 18.9648 3.95425 18.9027 4.14384L14.5057 17.5726C14.4285 17.8084 14.3545 18.0346 14.2801 18.2093C14.2172 18.3569 14.0739 18.68 13.7478 18.8696C13.3912 19.0769 12.9553 19.0949 12.5828 18.9178C12.2421 18.7558 12.0726 18.4456 11.9977 18.3037C11.9091 18.1357 11.8167 17.9164 11.7203 17.6878L9.41629 12.2247L3.83184 10.2325C3.59818 10.1491 3.37405 10.0692 3.20135 9.99022C3.05543 9.9235 2.73621 9.77174 2.55526 9.44076C2.3574 9.07885 2.35082 8.64263 2.53766 8.27491C2.70853 7.93862 3.02303 7.77729 3.16687 7.7062C3.33713 7.62204 3.55874 7.53539 3.78982 7.44503L16.9492 2.29758Z"
        fill="#121212"
        stroke="#F8F8F8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
    className?: string;
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
                ease: 'linear',
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
                ease: 'linear',
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
        className: orbit.className,
      };
    });
  }, [orbits]);

  return (
    <div className={cn('relative h-[200px] w-[200px]', className)}>
      {centerIcon && (
        <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-10">
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
            className={cn(
              '-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 rounded-full',
              orbit.className
            )}
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
                  className="flex h-8 w-8 items-center justify-center rounded-full border-[#E4E4E4] border-[0.7px] bg-gradient-to-b bg-gray-700 p-2 mix-blend-luminosity shadow-[inset_0px_0px_8px_0px_rgba(248,248,248,0.25)] drop-shadow-[0px_4px_6px_rgba(0,0,0,0.10)] will-change-transform"
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

const LogoOrbit = () => {
  const orbit1Icons = [
    <FaTwitter key="twitter" className="h-8 w-8 text-white" />,
    <FaFacebook key="facebook" className="h-8 w-8 text-white" />,
    <FaLinkedin key="linkedin" className="h-8 w-8 text-white" />,
  ];

  const orbit2Icons = [
    <FaYoutube key="youtube" className="h-6 w-6 text-white" />,
    <FaTwitch key="twitch" className="h-6 w-6 text-white" />,
    <FaReddit key="reddit" className="h-6 w-6 text-white" />,
    <FaDiscord key="discord" className="h-6 w-6 text-white" />,
  ];

  return (
    <OrbitingIcons
      centerIcon={<LogoIcon className="h-10 w-10" />}
      orbits={[
        {
          icons: orbit1Icons,
          rotationDirection: 'anticlockwise',
          radius: 50,
          speed: 9,
          className: 'bg-white',
        },
        {
          icons: orbit2Icons,
          rotationDirection: 'anticlockwise',
          radius: 90,
          speed: 15,
          className:
            'bg-[radial-gradient(circle,rgba(249,250,251,1)_0%,rgba(255,187,128,1)_50%,rgba(254,166,89,1)_100%)]',
        },
        {
          icons: orbit1Icons,
          rotationDirection: 'clockwise',
          radius: 140,
          speed: 7,
          className: 'bg-white',
        },
        {
          icons: orbit2Icons,
          rotationDirection: 'anticlockwise',
          radius: 180,
          speed: 15,
          className:
            'bg-[radial-gradient(circle,rgba(249,250,251,1)_0%,rgba(255,187,128,1)_50%,rgba(254,166,89,1)_100%)]',
        },
      ]}
    />
  );
};

const DashboardCard = () => {
  return (
    <div className="h-full w-full rounded-xl border border-gray-200 bg-white p-4">
      {/* Dashboard Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-6 flex items-center gap-2"
      >
        <div className="flex gap-2">
          <motion.div
            whileHover={{ scale: 1.2 }}
            className="h-3 w-3 rounded-full bg-[#FF5F57]"
          />
          <motion.div
            whileHover={{ scale: 1.2 }}
            className="h-3 w-3 rounded-full bg-[#FEBC2E]"
          />
          <motion.div
            whileHover={{ scale: 1.2 }}
            className="h-3 w-3 rounded-full bg-[#28C840]"
          />
        </div>
      </motion.div>

      {/* Dashboard Content */}
      <div className="flex h-full flex-col gap-4 md:flex-row">
        {/* Left Panel - User Profile */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          whileHover={{ scale: 1.02 }}
          className="flex-shrink-0 rounded-xl bg-[#F9FAFB] p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="overflow-hidden rounded-full bg-gray-200 ring-2 ring-white"
              >
                <Image
                  src="/images/kishore_gunnam.jpg"
                  alt="Kishore Gunnam Profile"
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 object-cover transition-transform hover:scale-105"
                />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className="-bottom-1 -right-1 absolute h-4 w-4 rounded-full border-2 border-white bg-green-500"
              />
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="space-y-1"
            >
              <div className="font-medium text-[10px] text-gray-400 tracking-wider md:text-xs">
                DESIGNER ENGINEER
              </div>
              <div className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text font-semibold text-transparent text-xs md:text-lg">
                Kishore Gunnam
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel - Content Area */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          whileHover={{ scale: 1.02 }}
          className="relative flex-1 rounded-xl bg-[#F9FAFB] p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <motion.div
            whileHover={{ x: -5 }}
            className="absolute top-4 left-0 mx-2 flex items-center text-gray-300"
          >
            <FaArrowCircleLeft className="h-6 w-6 cursor-pointer transition-colors hover:text-gray-600" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex h-full flex-col items-center justify-center text-gray-400"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Logo />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="text-sm"
            >
              Select a conversation to start messaging
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
