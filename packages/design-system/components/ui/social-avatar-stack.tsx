"use client"

import { cn } from "@delulu/design-system/lib/utils"
import {
  socialBackgroundColors,
  type SupportedSocialPlatform,
} from "@delulu/design-system/lib/social-config"
import { SocialIcon } from "@delulu/design-system/components/ui/social-icon"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@delulu/design-system/components/ui/tooltip"

export interface SocialAvatarItem {
  platform: SupportedSocialPlatform
  /** Tooltip label, e.g. "Instagram · @handle" */
  label: string
  /** Render as a greyed-out fallback (e.g. disconnected account). */
  muted?: boolean
}

const sizeMap = {
  sm: { circle: "size-5", icon: "size-2.5", chip: "text-[9px]" },
  md: { circle: "size-6", icon: "size-3", chip: "text-[10px]" },
  lg: { circle: "size-8", icon: "size-3.5", chip: "text-xs" },
} as const

interface SocialAvatarStackProps {
  items: SocialAvatarItem[]
  max?: number
  size?: keyof typeof sizeMap
  className?: string
}

function SocialAvatarStack({
  items,
  max = 4,
  size = "md",
  className,
}: SocialAvatarStackProps) {
  const s = sizeMap[size]
  const visible = items.slice(0, max)
  const overflow = items.slice(max)

  if (items.length === 0) return null

  return (
    <div className={cn("flex items-center -space-x-1.5", className)}>
      {visible.map((item, i) => (
        <Tooltip key={`${item.platform}-${i}`}>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "flex items-center justify-center rounded-full ring-2 ring-card",
                s.circle,
                item.muted
                  ? "bg-muted text-muted-foreground"
                  : socialBackgroundColors[item.platform]
              )}
            >
              <SocialIcon
                type={item.platform}
                className={cn(s.icon, item.muted ? "" : "text-white")}
              />
            </span>
          </TooltipTrigger>
          <TooltipContent>{item.label}</TooltipContent>
        </Tooltip>
      ))}
      {overflow.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "flex items-center justify-center rounded-full bg-zinc-600/10 font-medium text-zinc-700 ring-2 ring-card dark:bg-white/10 dark:text-zinc-300",
                s.circle,
                s.chip
              )}
            >
              +{overflow.length}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {overflow.map((o) => o.label).join("\n")}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

export { SocialAvatarStack }
