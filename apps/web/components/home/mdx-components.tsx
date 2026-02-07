import { cn } from "@delulu/design-system/lib/utils";
import Image, { type ImageProps } from "next/image";
import type React from "react";

const components = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="mb-4 font-bold text-4xl">{children}</h1>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-4">{children}</p>
  ),
  a: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a className="text-blue-500" href={href}>
      {children}
    </a>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="mb-4 list-disc pl-5">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="mb-4 list-decimal pl-5">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="mb-2">{children}</li>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="mb-4 border-neutral-300 border-l-2 py-2 pl-4 italic">
      {children}
    </blockquote>
  ),
  code: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code
      className={cn("relative rounded px-3 py-2 text-sm", className)}
      {...props}
    />
  ),
  pre: ({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) => {
    return (
      <pre
        className={cn(
          "mt-6 mb-4 overflow-x-auto rounded-lg border border-bg-gray-900 bg-gray-900 py-4",
          className
        )}
        {...props}
      />
    );
  },
  img: ({ src, alt, ...props }: { src: string; alt: string } & ImageProps) => (
    <Image
      alt={alt}
      className="mb-4 h-auto w-full rounded-md"
      height={1000}
      src={src}
      width={1000}
      {...props}
    />
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="mb-2 font-bold text-2xl">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="mb-1 font-bold text-xl">{children}</h3>
  ),
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4 className="mb-1 font-bold text-lg">{children}</h4>
  ),
  h5: ({ children }: { children: React.ReactNode }) => (
    <h5 className="mb-1 font-bold text-base">{children}</h5>
  ),
  h6: ({ children }: { children: React.ReactNode }) => (
    <h6 className="mb-1 font-bold text-sm">{children}</h6>
  ),
};

export { components };
