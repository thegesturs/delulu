import { cn } from "@delulu/design-system/lib/utils";
import { UserRound } from "lucide-react";

interface PlatformPostHeaderProps {
  avatarUrl?: string;
  displayName?: string;
  username?: string;
  detail?: string;
  meta?: string;
  variant: "visual" | "professional";
  className?: string;
}

export function PlatformPostHeader({
  avatarUrl,
  displayName,
  username,
  detail,
  meta,
  variant,
  className,
}: PlatformPostHeaderProps) {
  const name =
    variant === "professional"
      ? displayName || "Your name"
      : username || "your_username";

  return (
    <header className={cn("flex items-start gap-3 p-4", className)}>
      {avatarUrl ? (
        <img
          alt={`${displayName || username || "Profile"} avatar`}
          className={cn(
            "shrink-0 rounded-full object-cover",
            variant === "professional" ? "size-12" : "size-11"
          )}
          src={avatarUrl}
        />
      ) : (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
            variant === "professional" ? "size-12" : "size-11"
          )}
        >
          <UserRound aria-hidden className="size-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{name}</p>
        {variant === "visual" && displayName && (
          <p className="truncate text-muted-foreground text-xs">
            {displayName}
          </p>
        )}
        {variant === "professional" && detail && (
          <p className="truncate text-muted-foreground text-sm">{detail}</p>
        )}
        {meta && (
          <p className="truncate text-muted-foreground text-xs">{meta}</p>
        )}
      </div>
    </header>
  );
}
