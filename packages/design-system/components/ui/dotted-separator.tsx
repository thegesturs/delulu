import { cn } from "@delulu/design-system/lib/utils"

interface DottedSeparatorProps {
  orientation?: "horizontal" | "vertical"
  /** Extend the line edge-to-edge of the viewport, even inside a constrained container. */
  fullBleed?: boolean
  className?: string
}

/**
 * Theme-aware dotted rule used to separate page sections.
 * 1px line, `2 2` dash, zinc-950/white at 10% opacity (via `currentColor`).
 */
function DottedSeparator({
  orientation = "horizontal",
  fullBleed = false,
  className,
}: DottedSeparatorProps) {
  const isHorizontal = orientation === "horizontal"

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "text-zinc-950/10 dark:text-white/10",
        isHorizontal ? "h-px w-full" : "h-full w-px self-stretch",
        fullBleed && isHorizontal && "ml-[calc(50%-50vw)] w-screen",
        className
      )}
    >
      <svg
        aria-hidden
        className={cn(isHorizontal ? "h-px w-full" : "h-full w-px")}
        preserveAspectRatio="none"
      >
        {isHorizontal ? (
          <line
            x1="0"
            y1="0.5"
            x2="100%"
            y2="0.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            strokeLinejoin="round"
          />
        ) : (
          <line
            x1="0.5"
            y1="0"
            x2="0.5"
            y2="100%"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  )
}

export { DottedSeparator }
