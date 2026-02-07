"use client";
import { cn } from "@delulu/design-system/lib/utils";
import Image from "next/image";
import type React from "react";
import { useState } from "react";

export const BlurImage = (props: React.ComponentProps<typeof Image>) => {
  const [isLoading, setLoading] = useState(true);

  const { src, width, height, alt, layout, ...rest } = props;
  return (
    <Image
      alt={alt ? alt : "Avatar"}
      blurDataURL={src as string}
      className={cn(
        "transition duration-300",
        isLoading ? "blur-sm" : "blur-0",
        props.className
      )}
      decoding="async"
      height={height}
      layout={layout}
      loading="lazy"
      onLoad={() => setLoading(false)}
      src={src}
      width={width}
      {...rest}
    />
  );
};
