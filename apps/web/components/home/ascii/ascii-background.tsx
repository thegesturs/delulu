'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTheme } from '@delulu/design-system';
import { useMediaQuery } from '@delulu/design-system/hooks/use-media-query';
import dynamic from 'next/dynamic';

// Dynamically import the canvas component to avoid SSR issues
const AsciiCanvas = dynamic(() => import('./ascii-canvas'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted/20" />
});

interface AsciiBackgroundProps {
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  speed?: 'slow' | 'medium' | 'fast';
  opacity?: number;
}

export default function AsciiBackground({
  className = '',
  intensity = 'medium',
  speed = 'medium',
  opacity = 0.6,
}: AsciiBackgroundProps) {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isLowPerformance = useMediaQuery('(max-width: 480px)');
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  // Theme-based colors with more vibrant values
  const colors = useMemo(() => {
    if (theme === 'dark') {
      return {
        primary: [0.8, 0.9, 1.0] as [number, number, number],    // Light blue-white
        secondary: [0.1, 0.15, 0.3] as [number, number, number], // Dark blue
      };
    }
    return {
      primary: [0.2, 0.3, 0.5] as [number, number, number],      // Dark blue
      secondary: [0.85, 0.9, 0.95] as [number, number, number],  // Light blue-white
    };
  }, [theme]);

  // Performance-based settings
  const settings = useMemo(() => {
    const baseSettings = {
      low: { frequency: 1.0, characterSize: 12 },
      medium: { frequency: 2.0, characterSize: 8 },
      high: { frequency: 3.0, characterSize: 6 },
    }[intensity];

    const speedMultiplier = {
      slow: 0.3,
      medium: 0.5,
      fast: 0.8,
    }[speed];

    return {
      frequency: baseSettings.frequency,
      characterSize: baseSettings.characterSize,
      speed: speedMultiplier,
      contrast: intensity === 'high' ? 2.0 : 1.5,
    };
  }, [intensity, speed, isLowPerformance]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Only skip if user explicitly prefers reduced motion
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return (
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-background/50 to-muted/30 ${className}`}
      />
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <AsciiCanvas
        width={dimensions.width}
        height={dimensions.height}
        primaryColor={colors.primary}
        secondaryColor={colors.secondary}
        characterSize={settings.characterSize}
        frequency={settings.frequency}
        speed={settings.speed}
        contrast={settings.contrast}
        opacity={opacity}
      />
    </div>
  );
}