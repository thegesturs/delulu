import { SocialIcon as BaseSocialIcon } from '@delulu/design-system/components/ui/social-icon';
import type { SupportedSocialPlatform } from '@delulu/design-system/lib/social-config';
import type { SocialType } from '@delulu/validators/post';

interface SocialIconProps {
  type: SocialType;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function SocialIcon({ type, className, size = 'xs' }: SocialIconProps) {
  // Skip unsupported platforms
  if (!type) {
    return null;
  }

  return (
    <BaseSocialIcon
      type={type as SupportedSocialPlatform}
      className={className}
      size={size}
    />
  );
}
