'use client';
import type React from 'react';

interface DesktopMockupProps {
  children?: React.ReactNode;
  className?: string;
}

export function DesktopMockup({ children, className }: DesktopMockupProps) {
  return (
    <div
      className={`mx-auto aspect-video w-full rounded-t-lg bg-secondary shadow-2xl ${className ?? ''}`}
    >
      {/* Browser top bar */}
      <div className="flex h-10 items-center space-x-2 rounded-t-lg bg-card px-4">
        <div className="h-3 w-3 rounded-full bg-red-500" />
        <div className="h-3 w-3 rounded-full bg-yellow-400" />
        <div className="h-3 w-3 rounded-full bg-green-500" />
        <div className="ml-auto flex h-6 flex-grow items-center rounded-md bg-accent px-3 text-secondary-foreground text-sm">
          solulu.delulu.social/post
        </div>
      </div>
      {/* Screen content */}
      <div className="aspect-[16/10] w-full overflow-hidden rounded-b-lg bg-background">
        {children}
      </div>
    </div>
  );
}
