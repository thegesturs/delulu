'use client';

import { cn } from '@delulu/design-system/lib/utils';
import { motion } from 'motion/react';
import React from 'react';
import {
  FaDiscord,
  FaFacebook,
  FaFileAlt,
  FaImage,
  FaInstagram,
  FaLinkedin,
  FaReddit,
  FaRegFileAlt,
  FaTwitch,
  FaTwitter,
  FaYoutube,
} from 'react-icons/fa';
import { LogoIcon } from './logo';

export function Features2() {
  return (
    <div
      id="product"
      className="mx-auto w-full max-w-7xl px-4 py-4 md:my-20 md:px-8 md:py-20"
    >
      <div className="mb-16 text-center">
        <h2 className="mb-4 font-bold text-4xl text-foreground md:text-6xl">
          More Than Just a <span className="text-primary">Scheduler</span>
        </h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Powerful features that transform your social media workflow from chaos
          to clarity
        </p>
      </div>
      <div className="cols-1 mx-auto mt-20 grid max-w-3xl auto-rows-[25rem] gap-4 lg:max-w-none lg:grid-cols-5">
        <Card className="relative flex flex-col justify-between lg:col-span-3">
          <div className="absolute inset-0">
            <MapView />
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 h-[70%] bg-gradient-to-t from-background via-background/90 to-transparent" />
          <CardContent className="absolute bottom-0 z-10">
            <CardTitle>Eliminate Platform-Hopping</CardTitle>
            <CardDescription>
              Manage every social account from a single calendar—no more tab
              chaos.
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="relative flex flex-col justify-between lg:col-span-2">
          <Chart />
          <div className="absolute inset-x-0 bottom-0 z-10 h-[40%] bg-gradient-to-t from-background via-background/90 to-transparent" />
          <CardContent className="absolute bottom-0 z-10">
            <CardTitle>Never Miss a Peak Moment</CardTitle>
            <CardDescription>
              With our tool, you can schedule posts ahead of time for peak
              hours, ensuring you're always on top of the wave without worrying
              about posting at the correct time.
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="relative flex flex-col justify-between bg-transparent lg:col-span-2">
          <div className="absolute inset-0 flex items-center justify-center">
            <LogoOrbit />
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 h-[70%] bg-gradient-to-t from-background via-background/90 to-transparent" />
          <CardContent className="absolute bottom-0 z-10">
            <CardTitle>One Dashboard, Clear View</CardTitle>
            <CardDescription>
              See upcoming posts, past performance, and approve drafts—without
              switching apps.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between lg:col-span-3">
          <CardSkeletonBody>
            <div className="mt-6 h-full w-full rounded-lg p-4 px-2 md:px-10">
              <DashboardCard />
            </div>
          </CardSkeletonBody>
          <CardContent className="h-40">
            <CardTitle>Batch-Create & Bulk-Schedule</CardTitle>
            <CardDescription>
              Record once, queue dozens of posts in seconds—set up an entire
              month in minutes.
            </CardDescription>
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
        'inline-block font-[500] text-[22px] text-foreground leading-[31px]',
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
        'mt-2 max-w-sm text-muted-foreground text-sm tracking-tight',
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
        'group relative isolate flex flex-col overflow-hidden rounded-2xl',
        'border border-border bg-card/50',
        'shadow-sm transition-all duration-300 hover:shadow-xl',
        className
      )}
    >
      {children}
    </motion.div>
  );
};

const MapView = () => {
  const platforms = [
    { icon: FaTwitter, name: 'Twitter', x: '15%', y: '10%' },
    { icon: FaFacebook, name: 'Facebook', x: '75%', y: '10%' },
    { icon: FaLinkedin, name: 'LinkedIn', x: '20%', y: '20%' },
    { icon: FaYoutube, name: 'YouTube', x: '80%', y: '20%' },
    { icon: FaReddit, name: 'Reddit', x: '10%', y: '30%' },
    { icon: FaInstagram, name: 'Instagram', x: '90%', y: '30%' },
  ];

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-card">
      {/* Central Hub */}
      <motion.div
        className="absolute flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/20"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <LogoIcon className="h-8 w-8 text-primary" />
      </motion.div>

      {/* Connecting Lines and Platform Icons */}
      {platforms.map((platform, index) => (
        <React.Fragment key={platform.name}>
          <motion.svg
            className="absolute inset-0 z-0"
            width="100%"
            height="100%"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
          >
            <line
              x1="50%"
              y1="50%"
              x2={platform.x}
              y2={platform.y}
              className="stroke-border"
              strokeWidth="1"
            />
          </motion.svg>
          <motion.div
            className="absolute z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-md"
            style={{
              left: `calc(${platform.x} - 20px)`,
              top: `calc(${platform.y} - 20px)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
          >
            <platform.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
          </motion.div>
        </React.Fragment>
      ))}
    </div>
  );
};

const Chart = () => {
  const peakData = [30, 45, 60, 85, 70, 50, 40]; // Representing engagement data
  const peakTimeIndex = 3; // Index of the highest peak
  const chartWidth = 260;
  const chartHeight = 150;
  const xPadding = 20;
  const yPadding = 20;

  const getX = (index: number) =>
    xPadding + (index * (chartWidth - 2 * xPadding)) / (peakData.length - 1);
  const getY = (value: number) =>
    chartHeight - yPadding - (value / 100) * (chartHeight - 2 * yPadding); // Assuming peakData values are percentages

  const linePath = peakData
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(p)}`)
    .join(' ');
  const areaPath = `${linePath} L${getX(peakData.length - 1)},${chartHeight - yPadding} L${getX(0)},${chartHeight - yPadding} Z`;

  return (
    // Added subtle card-like styling back for better visual separation
    <div className="m-4 mx-auto flex h-full w-full max-w-[290px] flex-col items-center justify-center rounded-lg border border-border/30 bg-card/30 p-4 ">
      {/* Chart Container */}
      <div className="relative h-[180px] w-full">
        {' '}
        {/* Increased height slightly for axes */}
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                className="stop-primary/30 dark:stop-primary/20"
              />
              <stop offset="100%" className="stop-primary/0" />
            </linearGradient>
          </defs>

          {/* Subtle Y-Axis Line */}
          <line
            x1={xPadding}
            y1={yPadding}
            x2={xPadding}
            y2={chartHeight - yPadding}
            className="stroke-border/50"
            strokeWidth="1"
          />
          {/* Subtle X-Axis Line */}
          <line
            x1={xPadding}
            y1={chartHeight - yPadding}
            x2={chartWidth - xPadding}
            y2={chartHeight - yPadding}
            className="stroke-border/50"
            strokeWidth="1"
          />

          {/* Grid Lines (optional, can be removed if too cluttered) */}
          {[25, 50, 75].map((val) => (
            <line
              key={`grid-${val}`}
              x1={xPadding}
              y1={getY(val)}
              x2={chartWidth - xPadding}
              y2={getY(val)}
              className="stroke-border/30"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          ))}

          {/* Area Path under the line */}
          <motion.path
            d={areaPath}
            className="fill-[url(#areaGradient)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeInOut' }}
          />

          {/* Line Path */}
          <motion.path
            d={linePath}
            className="fill-transparent stroke-primary"
            strokeWidth="2.5" // Slightly thicker line
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />

          {/* Peak Point Highlight */}
          <motion.circle
            cx={getX(peakTimeIndex)}
            cy={getY(peakData[peakTimeIndex])}
            r="5" // Slightly larger radius
            className="fill-primary stroke-background"
            strokeWidth="2.5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.8,
              duration: 0.5,
              type: 'spring',
              stiffness: 300,
            }}
          />
        </svg>
      </div>
    </div>
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
  const orbitData = React.useMemo(() => {
    return orbits.map((orbit, orbitIndex) => {
      const radius = orbit.radius || 100 + orbitIndex * 80;
      const speed = orbit.speed || 1;
      const iconCount = orbit.icons.length;
      const angleStep = 360 / iconCount;
      const angles = Array.from({ length: iconCount }, (_, i) => angleStep * i);

      const iconData = angles.map((angle) => {
        const rotationAngle =
          orbit.rotationDirection === 'clockwise'
            ? [angle, angle - 360]
            : [angle, angle + 360];
        return {
          angle,
          rotationAngle,
          animation: {
            initial: { rotate: angle, scale: 1, opacity: 1 },
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
                rotate: {
                  duration: speed,
                  repeat: Number.POSITIVE_INFINITY,
                },
              },
            },
          },
        };
      });
      return { radius, speed, iconData, className: orbit.className };
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
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background p-1 shadow-md"
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
  const iconClassName =
    'h-full w-full text-muted-foreground transition-colors group-hover:text-primary'; // Order: size, text color, transition, pseudo-state

  const orbit1Icons = [
    <FaTwitter key="twitter" className={iconClassName} />,
    <FaFacebook key="facebook" className={iconClassName} />,
    <FaLinkedin key="linkedin" className={iconClassName} />,
  ];

  const orbit2Icons = [
    <FaYoutube key="youtube" className={iconClassName} />,
    <FaTwitch key="twitch" className={iconClassName} />,
    <FaReddit key="reddit" className={iconClassName} />,
    <FaDiscord key="discord" className={iconClassName} />,
  ];

  return (
    <OrbitingIcons
      centerIcon={<LogoIcon className="h-10 w-10 text-primary" />} // Order: size, text color
      orbits={[
        {
          icons: orbit1Icons,
          rotationDirection: 'anticlockwise',
          radius: 60,
          speed: 9,
          className: 'bg-border/30',
        },
        {
          icons: orbit2Icons,
          rotationDirection: 'anticlockwise',
          radius: 100,
          speed: 15,
          className: 'bg-primary/10',
        },
        {
          icons: orbit1Icons.slice(0, 2),
          rotationDirection: 'clockwise',
          radius: 140,
          speed: 7,
          className: 'bg-border/20',
        },
      ]}
    />
  );
};

const DashboardCard = () => {
  // Mock data for a content queue
  const contentQueue = [
    { id: 1, title: 'New Blog Post Idea', type: 'Blog', status: 'Draft' },
    { id: 2, title: 'Video Teaser Clip', type: 'Video', status: 'Scheduled' },
    { id: 3, title: 'Image Carousel', type: 'Image', status: 'Scheduled' },
    {
      id: 4,
      title: 'Product Update Announcement',
      type: 'Text',
      status: 'Needs Approval',
    },
    { id: 5, title: 'Shorts Montage', type: 'Video', status: 'Draft' },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'Scheduled')
      return 'bg-green-500/20 text-green-700 dark:text-green-400';
    if (status === 'Needs Approval')
      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
    return 'bg-muted-foreground/10 text-muted-foreground'; // Draft or other
  };

  const getTypeIcon = (type: string) => {
    if (type === 'Video')
      return <FaYoutube className="mr-2 h-4 w-4 text-red-500" />;
    if (type === 'Image')
      return <FaImage className="mr-2 h-4 w-4 text-blue-500" />;
    if (type === 'Blog')
      return <FaFileAlt className="mr-2 h-4 w-4 text-purple-500" />;
    return <FaRegFileAlt className="mr-2 h-4 w-4 text-gray-500" />; // Replaced FaFileLines
  };

  return (
    <div className="flex h-full w-full flex-col rounded-lg border border-border bg-card p-4 shadow-sm">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-3 flex items-center justify-between"
      >
        <h4 className="font-semibold text-foreground">Content Queue</h4>
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-muted" />
          <div className="h-2.5 w-2.5 rounded-full bg-muted" />
          <div className="h-2.5 w-2.5 rounded-full bg-muted" />
        </div>
      </motion.div>

      {/* Content Queue List */}
      <motion.div
        className="space-y-2 overflow-y-auto pr-1"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
      >
        {contentQueue.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
            className="flex items-center justify-between rounded-md border border-border/70 bg-background p-2.5 shadow-xs transition-shadow hover:shadow-md"
          >
            <div className="flex items-center overflow-hidden">
              {getTypeIcon(item.type)}
              <span className="truncate text-foreground/90 text-xs">
                {item.title}
              </span>
            </div>
            <span
              className={cn(
                'ml-2 whitespace-nowrap rounded-full px-2 py-0.5 font-medium text-[10px]',
                getStatusColor(item.status)
              )}
            >
              {item.status}
            </span>
          </motion.div>
        ))}
      </motion.div>

      <p className="mt-auto pt-2 text-center text-[10px] text-muted-foreground">
        Drag & drop to reorder. Bulk actions available.
      </p>
    </div>
  );
};
