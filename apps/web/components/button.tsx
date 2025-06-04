'use client';
import { cn } from '@delulu/design-system/lib/utils';
import React from 'react';

export const Button = <T extends React.ElementType = 'a'>({
  href,
  as,
  children,
  className,
  variant = 'primary',
  ...props
}: {
  href?: string;
  as?: T;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'dark' | 'gradient';
} & Omit<
  React.ComponentPropsWithoutRef<T>,
  'as' | 'href' | 'children' | 'className' | 'variant'
>) => {
  const Tag = as || ('a' as React.ElementType as T);

  const baseStyles = cn(
    'relative flex rounded-[6px] px-4 py-2 font-bold text-sm',
    'hover:-translate-y-0.5 cursor-pointer transition duration-200',
    'inline-flex items-center justify-center',
    'text-black'
  );

  const variantStyles = {
    primary: cn(
      'rounded-[6px]',
      'bg-[linear-gradient(181deg,_#5E5E5E_18.12%,_#000_99.57%)]',
      'shadow-[0px_4px_8px_0px_rgba(3,_7,_18,_0.06),_0px_2px_4px_0px_rgba(3,_7,_18,_0.06),',
      '0px_0px_0px_1px_rgba(3,_7,_18,_0.08),_0px_1px_1px_2px_rgba(255,_255,_255,_0.40)_inset,',
      '0px_-1px_5px_2px_rgba(255,_255,_255,_0.40)_inset]',
      'text-white'
    ),
    secondary: cn('rounded-[6px] border border-[#E5E5E5] bg-white'),
    dark: cn('rounded-[6px] bg-gray-800 text-white'),
    gradient: cn(
      'bg-gradient-to-b from-blue-500 to-blue-700 text-white',
      'shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]'
    ),
  };

  return React.createElement(
    Tag,
    {
      ...(href !== undefined && { href }),
      className: cn(baseStyles, variantStyles[variant], className),
      ...props,
    },
    children
  );
};
