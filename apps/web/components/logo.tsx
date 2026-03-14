"use client";
import { LogoIcon } from "@delulu/design-system/components/logo";
import { cn } from "@delulu/design-system/lib/utils";
import Link from "next/link";

export { LogoIcon };

export const Logo = ({ className }: { className?: string }) => {
  return (
    <Link
      className={cn(
        "relative z-20 flex shrink-0 items-center justify-center gap-2 px-2 py-1 font-normal text-foreground/90 text-sm",
        className
      )}
      href="/"
    >
      <LogoIcon className="size-6" />

      <span className="font-medium text-foreground/90 text-lg">Delulu</span>
    </Link>
  );
};
