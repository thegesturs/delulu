'use client';

import { cn } from '../../lib/utils';
import {
  socialColors,
  socialIcons,
  sizeClasses,
  type SocialIconSize,
  type SupportedSocialPlatform,
} from '../../lib/social-config';

interface SocialIconProps {
  type: SupportedSocialPlatform;
  className?: string;
  size?: SocialIconSize;
}

export function SocialIcon({ type, className, size = 'sm' }: SocialIconProps) {
  const Icon = socialIcons[type];
  if (!Icon) return null;

  return (
    <Icon
      className={cn(
        sizeClasses[size],
        socialColors[type],
        className
      )}
    />
  );
} 