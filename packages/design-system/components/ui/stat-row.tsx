import type { ReactNode } from "react"

import { cn } from "@delulu/design-system/lib/utils"
import { Card } from "@delulu/design-system/components/ui/card"
import { Skeleton } from "@delulu/design-system/components/ui/skeleton"

export interface StatTileProps {
  label: string
  /** Undefined renders a skeleton (loading). */
  value?: string | number
  icon?: ReactNode
  delta?: { value: string; trend: "up" | "down" | "flat" }
  hint?: string
  href?: string
  className?: string
  /** "sm" tightens padding and shrinks the value for denser rows. */
  size?: "sm" | "default"
}

const trendClasses = {
  up: "text-green-600 dark:text-green-400",
  down: "text-red-600 dark:text-red-400",
  flat: "text-muted-foreground",
} as const

function TrendArrow({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "flat") return null
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className={cn("size-3", trend === "down" && "rotate-180")}
      fill="none"
    >
      <path
        d="M6 2.5v7M6 2.5 3 5.5M6 2.5 9 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StatTile({
  label,
  value,
  icon,
  delta,
  hint,
  href,
  className,
  size = "default",
}: StatTileProps) {
  const isLoading = value === undefined
  const Comp = href ? "a" : "div"
  const dense = size === "sm"

  return (
    <Comp
      href={href}
      className={cn(
        "flex flex-col border-t border-l border-border/60",
        dense ? "gap-1 p-3" : "gap-2 p-4",
        href &&
          "transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none",
        className
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon && <span className="flex items-center [&_svg]:size-4">{icon}</span>}
        <span className={cn("font-medium", dense ? "text-xs" : "text-sm")}>
          {label}
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        {isLoading ? (
          <Skeleton className={cn("w-16", dense ? "h-6" : "h-8")} />
        ) : (
          <span
            className={cn(
              "font-semibold tabular-nums leading-none",
              dense ? "text-lg" : "text-2xl"
            )}
          >
            {value}
          </span>
        )}
        {delta && !isLoading && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trendClasses[delta.trend]
            )}
          >
            <TrendArrow trend={delta.trend} />
            {delta.value}
          </span>
        )}
      </div>
      {hint && !isLoading && (
        <span className="text-xs text-muted-foreground">{hint}</span>
      )}
    </Comp>
  )
}

interface StatRowProps {
  children: ReactNode
  /** Number of columns at the lg breakpoint (mobile is always 2). */
  columns?: 2 | 3 | 4
  className?: string
}

const lgColsClass = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
} as const

function StatRow({ children, columns = 4, className }: StatRowProps) {
  return (
    <Card className={cn("overflow-hidden py-0", className)}>
      {/* Negative offset clips the outermost top/left borders so only the
          internal dividers remain, at any column count. */}
      <div
        className={cn(
          "-mt-px -ml-px grid grid-cols-2",
          lgColsClass[columns]
        )}
      >
        {children}
      </div>
    </Card>
  )
}

export { StatRow, StatTile }
