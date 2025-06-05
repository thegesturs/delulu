'use client';
import { cn } from '@delulu/design-system/lib/utils';
import Image from 'next/image';
import type React from 'react';
import { useState } from 'react';

export const BlurImage = (props: React.ComponentProps<typeof Image>) => {
  const [isLoading, setLoading] = useState(true);

  const { src, width, height, alt, layout, ...rest } = props;
  return (
    <Image
      className={cn(
        'transition duration-300',
        isLoading ? 'blur-sm' : 'blur-0',
        props.className
      )}
      onLoad={() => setLoading(false)}
      src={src}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      blurDataURL={src as string}
      layout={layout}
      alt={alt ? alt : 'Avatar'}
      {...rest}
    />
  );
};
