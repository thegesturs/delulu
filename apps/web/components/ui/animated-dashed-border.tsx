'use client';

import { cn } from '@delulu/design-system/lib/utils';
import type { ReactNode } from 'react';

interface AnimatedDashedBorderProps {
  children: ReactNode;
  className?: string;
  dashLength?: number;
  gapLength?: number;
  speed?: number;
  color?: string;
}

export const AnimatedDashedBorder = ({
  children,
  className,
  dashLength = 20,
  gapLength = 10,
  speed = 3,
  color = 'hsl(var(--border) / 0.5)',
}: AnimatedDashedBorderProps) => {
  const totalLength = dashLength + gapLength;

  return (
    <div
      className={cn('relative', className)}
      style={
        {
          '--dash-length': `${dashLength}px`,
          '--gap-length': `${gapLength}px`,
          '--total-length': `${totalLength}px`,
          '--animation-speed': `${speed}s`,
          '--border-color': color,
        } as React.CSSProperties & Record<string, string>
      }
    >
      {children}
      <div
        className="absolute bottom-0 left-0 h-[1px] w-full overflow-hidden"
        style={{
          background: `repeating-linear-gradient(
            to right,
            var(--border-color) 0,
            var(--border-color) var(--dash-length),
            transparent var(--dash-length),
            transparent var(--total-length)
          )`,
          backgroundSize: `var(--total-length) 1px`,
          animation: `moveDashes var(--animation-speed) linear infinite`,
        }}
      />
      <style jsx>{`
        @keyframes moveDashes {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: var(--total-length) 0;
          }
        }
      `}</style>
    </div>
  );
};
