import { cn } from "@delulu/design-system/lib/utils";
import Image from "next/image";

const previewStyles = {
  full: "object-contain object-left-top",
  composer: "scale-[1.28] object-cover object-[38%_18%]",
  schedule: "scale-[1.34] object-cover object-[86%_16%]",
} as const;

export function ProductPreview({
  className,
  crop = "full",
  priority = false,
  label = "Delulu social publishing workspace",
  sizes = "(min-width: 1024px) 50vw, 94vw",
}: {
  className?: string;
  crop?: keyof typeof previewStyles;
  priority?: boolean;
  label?: string;
  sizes?: string;
}) {
  return (
    <figure
      className={cn(
        "isolate overflow-hidden rounded-2xl bg-card shadow-[0_24px_80px_-32px_color-mix(in_oklab,var(--foreground),transparent_65%)] ring-1 ring-foreground/10",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="flex h-9 items-center gap-1.5 border-b bg-muted/70 px-3"
      >
        <span className="size-2.5 rounded-full bg-red-400/85" />
        <span className="size-2.5 rounded-full bg-amber-400/85" />
        <span className="size-2.5 rounded-full bg-emerald-400/85" />
        <span className="ml-2 truncate font-mono text-[11px] text-muted-foreground">
          app.delulu.social
        </span>
      </div>
      <div className="relative aspect-[1.72/1] overflow-hidden bg-[#f8f8fb]">
        <Image
          alt={label}
          className={cn("select-none", previewStyles[crop])}
          fill
          priority={priority}
          sizes={sizes}
          src="/images/app-dark.png"
        />
      </div>
    </figure>
  );
}
