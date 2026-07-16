import type { SupportedSocialPlatform } from "@delulu/design-system/lib/social-config";
import { cn } from "@delulu/design-system/lib/utils";
import { UserRound } from "lucide-react";

interface PlatformPostHeaderProps {
  avatarUrl?: string;
  displayName?: string;
  username?: string;
  detail?: string;
  meta?: string;
  platform?: SupportedSocialPlatform;
  className?: string;
}

export function PlatformPostHeader({
  avatarUrl,
  displayName,
  username,
  detail,
  meta,
  platform,
  className,
}: PlatformPostHeaderProps) {
  const professional = platform === "LINKEDIN";
  const usernameFirst = platform === "INSTAGRAM" || platform === "THREADS";
  const name = usernameFirst
    ? username || "your_username"
    : displayName || username || "Your profile";

  return (
    <header className={cn("flex items-start gap-3 p-4", className)}>
      {avatarUrl ? (
        <img
          alt={`${displayName || username || "Profile"} avatar`}
          className={cn(
            "shrink-0 rounded-full object-cover",
            professional ? "size-12" : "size-11"
          )}
          src={avatarUrl}
        />
      ) : (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
            professional ? "size-12" : "size-11"
          )}
        >
          <UserRound aria-hidden className="size-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{name}</p>
        {!(professional || usernameFirst) && username && (
          <p className="truncate text-muted-foreground text-xs">@{username}</p>
        )}
        {professional && detail && (
          <p className="truncate text-muted-foreground text-sm">{detail}</p>
        )}
        {meta && (
          <p className="truncate text-muted-foreground text-xs">{meta}</p>
        )}
      </div>
    </header>
  );
}
