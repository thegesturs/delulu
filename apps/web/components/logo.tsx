'use client';
import { cn } from '@delulu/design-system/lib/utils';
import Link from 'next/link';

export const LogoIcon = ({ className }: { className?: string }) => (
  <svg
    width="28"
    height="29"
    viewBox="0 0 28 29"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g filter="url(#filter0_di_966_1877)">
      <path
        d="M4.53553 16.0355C2.58291 14.0829 2.58291 10.9171 4.53553 8.96447L10.1924 3.30761C12.145 1.35499 15.3108 1.35499 17.2635 3.30761L22.9203 8.96447C24.8729 10.9171 24.8729 14.0829 22.9203 16.0355L17.2635 21.6924C15.3108 23.645 12.145 23.645 10.1924 21.6924L4.53553 16.0355Z"
        fill="#FB4C01"
      />
    </g>
    <defs>
      <filter
        id="filter0_di_966_1877"
        x="0.0712891"
        y="0.843262"
        width="27.3135"
        height="27.3135"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="2" />
        <feGaussianBlur stdDeviation="1.5" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_966_1877"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_966_1877"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="2" />
        <feGaussianBlur stdDeviation="2" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 0.664321 0 0 0 0 0.520459 0 0 0 1 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect2_innerShadow_966_1877"
        />
      </filter>
    </defs>
  </svg>
);

export const Logo = ({ className }: { className?: string }) => {
  return (
    <Link
      href="/"
      className={cn(
        'relative z-20 flex shrink-0 items-center justify-center gap-2 px-2 py-1 font-normal text-black text-sm',
        className
      )}
    >
      <LogoIcon />

      <span className="font-medium text-black text-lg">Delulu Social</span>
    </Link>
  );
};
