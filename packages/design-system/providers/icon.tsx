import { HugeiconsIcon } from '@hugeicons/react';
import type { ComponentProps } from 'react';

type IconProps = ComponentProps<typeof HugeiconsIcon>;

export function Icon({
  size = 16,
  color = 'currentColor',
  strokeWidth = 1.5,
  ...rest
}: IconProps) {
  return (
    <HugeiconsIcon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      {...rest}
    />
  );
}