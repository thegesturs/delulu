"use client";

import type { SupportedSocialPlatform } from "@delulu/design-system/lib/social-config";
import {
  socialBackgroundColors,
  socialIcons,
} from "@delulu/design-system/lib/social-config";
import { cn } from "@delulu/design-system/lib/utils";
import { ClockIcon } from "@hugeicons-pro/core-solid-rounded";
import { format } from "date-fns";
import type React from "react";
import { Icon } from "../../providers/icon";

export interface SocialPostEventData {
  id: string;
  title: string;
  scheduledTime: Date;
  platforms: Array<{
    type: SupportedSocialPlatform;
    displayName: string;
  }>;
  contentPreview?: string;
  mediaThumbnail?: string;
  status: "scheduled" | "processing" | "failed";
  failureMessage?: string;
}

interface SocialPostEventProps {
  event: SocialPostEventData;
  onClick?: (event: SocialPostEventData) => void;
  className?: string;
}

export function SocialPostEvent({
  event,
  onClick,
  className,
}: SocialPostEventProps) {
  const primaryPlatform = event.platforms[0];
  const PrimaryIcon = primaryPlatform
    ? socialIcons[primaryPlatform.type]
    : null;
  const additionalPlatformCount = event.platforms.length - 1;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(event);
  };

  return (
    // biome-ignore lint/nursery/noStaticElementInteractions: <explanation>
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className={cn(
        "group relative flex flex-col gap-2 rounded-sm border bg-card p-3 transition-all duration-200",
        "cursor-pointer hover:shadow-md",
        "hover:border-primary/20",
        event.status === "failed" && "border-destructive/50 bg-destructive/5",
        className
      )}
      onClick={handleClick}
    >
      {/* Time Badge - 12 hour format */}
      <div className="flex items-center gap-1 font-semibold text-foreground text-xs">
        <Icon icon={ClockIcon} size={14} />
        <span>{format(event.scheduledTime, "h:mm a")}</span>
      </div>

      {/* Platform Icon with counter */}
      <div className="flex items-center gap-2">
        {primaryPlatform && PrimaryIcon && (
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full shadow-sm",
                socialBackgroundColors[primaryPlatform.type]
              )}
            >
              <PrimaryIcon className="h-4 w-4 text-white" />
            </div>
            {additionalPlatformCount > 0 && (
              <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-muted font-semibold text-[9px]">
                +{additionalPlatformCount}
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <span className="line-clamp-2 flex-1 font-medium text-xs leading-tight">
          {event.title}
        </span>
      </div>

      {/* Media Thumbnail */}
      {event.mediaThumbnail && (
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
          {/* biome-ignore lint/nursery/noImgElement: Media thumbnail preview in calendar */}
          <img
            alt="Post media"
            className="h-full w-full object-cover"
            loading="lazy"
            src={event.mediaThumbnail}
          />
        </div>
      )}

      {/* Content Preview */}
      {event.contentPreview && (
        <p className="line-clamp-2 text-muted-foreground text-xs">
          {event.contentPreview}
        </p>
      )}

      {/* Status Badge */}
      {event.status !== "scheduled" && (
        <div className="absolute top-2 right-2">
          {event.status === "processing" && (
            <div className="flex h-5 items-center gap-1 rounded-full bg-amber-100 px-2 dark:bg-amber-900/30">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-600 dark:bg-amber-500" />
              <span className="font-medium text-[10px] text-amber-700 dark:text-amber-400">
                Publishing
              </span>
            </div>
          )}
          {event.status === "failed" && (
            <div className="flex h-5 items-center gap-1 rounded-full bg-destructive/10 px-2">
              <span className="font-medium text-[10px] text-destructive">
                Failed
              </span>
            </div>
          )}
        </div>
      )}

      {/* Hover overlay for quick actions */}
      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition-all group-hover:bg-black/5 group-hover:opacity-100" />
    </div>
  );
}
