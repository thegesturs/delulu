import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@delulu/design-system/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        red: "border-transparent bg-red-500/15 text-red-700 [a&]:hover:bg-red-500/25 dark:bg-red-500/10 dark:text-red-400 dark:[a&]:hover:bg-red-500/20 focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40",
        orange:
          "border-transparent bg-orange-500/15 text-orange-700 [a&]:hover:bg-orange-500/25 dark:bg-orange-500/10 dark:text-orange-400 dark:[a&]:hover:bg-orange-500/20 focus-visible:ring-orange-500/20 dark:focus-visible:ring-orange-500/40",
        amber:
          "border-transparent bg-amber-400/20 text-amber-700 [a&]:hover:bg-amber-400/30 dark:bg-amber-400/10 dark:text-amber-400 dark:[a&]:hover:bg-amber-400/15 focus-visible:ring-amber-400/20 dark:focus-visible:ring-amber-400/40",
        yellow:
          "border-transparent bg-yellow-400/20 text-yellow-700 [a&]:hover:bg-yellow-400/30 dark:bg-yellow-400/10 dark:text-yellow-300 dark:[a&]:hover:bg-yellow-400/15 focus-visible:ring-yellow-400/20 dark:focus-visible:ring-yellow-400/40",
        lime: "border-transparent bg-lime-400/20 text-lime-700 [a&]:hover:bg-lime-400/30 dark:bg-lime-400/10 dark:text-lime-300 dark:[a&]:hover:bg-lime-400/15 focus-visible:ring-lime-400/20 dark:focus-visible:ring-lime-400/40",
        green:
          "border-transparent bg-green-500/15 text-green-700 [a&]:hover:bg-green-500/25 dark:bg-green-500/10 dark:text-green-400 dark:[a&]:hover:bg-green-500/20 focus-visible:ring-green-500/20 dark:focus-visible:ring-green-500/40",
        emerald:
          "border-transparent bg-emerald-500/15 text-emerald-700 [a&]:hover:bg-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:[a&]:hover:bg-emerald-500/20 focus-visible:ring-emerald-500/20 dark:focus-visible:ring-emerald-500/40",
        teal: "border-transparent bg-teal-500/15 text-teal-700 [a&]:hover:bg-teal-500/25 dark:bg-teal-500/10 dark:text-teal-300 dark:[a&]:hover:bg-teal-500/20 focus-visible:ring-teal-500/20 dark:focus-visible:ring-teal-500/40",
        cyan: "border-transparent bg-cyan-400/20 text-cyan-700 [a&]:hover:bg-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300 dark:[a&]:hover:bg-cyan-400/15 focus-visible:ring-cyan-400/20 dark:focus-visible:ring-cyan-400/40",
        sky: "border-transparent bg-sky-500/15 text-sky-700 [a&]:hover:bg-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300 dark:[a&]:hover:bg-sky-500/20 focus-visible:ring-sky-500/20 dark:focus-visible:ring-sky-500/40",
        blue: "border-transparent bg-blue-500/15 text-blue-700 [a&]:hover:bg-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400 dark:[a&]:hover:bg-blue-500/25 focus-visible:ring-blue-500/20 dark:focus-visible:ring-blue-500/40",
        indigo:
          "border-transparent bg-indigo-500/15 text-indigo-700 [a&]:hover:bg-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-400 dark:[a&]:hover:bg-indigo-500/20 focus-visible:ring-indigo-500/20 dark:focus-visible:ring-indigo-500/40",
        violet:
          "border-transparent bg-violet-500/15 text-violet-700 [a&]:hover:bg-violet-500/25 dark:bg-violet-500/10 dark:text-violet-400 dark:[a&]:hover:bg-violet-500/20 focus-visible:ring-violet-500/20 dark:focus-visible:ring-violet-500/40",
        purple:
          "border-transparent bg-purple-500/15 text-purple-700 [a&]:hover:bg-purple-500/25 dark:bg-purple-500/10 dark:text-purple-400 dark:[a&]:hover:bg-purple-500/20 focus-visible:ring-purple-500/20 dark:focus-visible:ring-purple-500/40",
        fuchsia:
          "border-transparent bg-fuchsia-400/15 text-fuchsia-700 [a&]:hover:bg-fuchsia-400/25 dark:bg-fuchsia-400/10 dark:text-fuchsia-400 dark:[a&]:hover:bg-fuchsia-400/20 focus-visible:ring-fuchsia-400/20 dark:focus-visible:ring-fuchsia-400/40",
        pink: "border-transparent bg-pink-400/15 text-pink-700 [a&]:hover:bg-pink-400/25 dark:bg-pink-400/10 dark:text-pink-400 dark:[a&]:hover:bg-pink-400/20 focus-visible:ring-pink-400/20 dark:focus-visible:ring-pink-400/40",
        rose: "border-transparent bg-rose-400/15 text-rose-700 [a&]:hover:bg-rose-400/25 dark:bg-rose-400/10 dark:text-rose-400 dark:[a&]:hover:bg-rose-400/20 focus-visible:ring-rose-400/20 dark:focus-visible:ring-rose-400/40",
        zinc: "border-transparent bg-zinc-600/10 text-zinc-700 [a&]:hover:bg-zinc-600/20 dark:bg-white/5 dark:text-zinc-400 dark:[a&]:hover:bg-white/10 focus-visible:ring-zinc-600/20 dark:focus-visible:ring-white/20",
      },
      size: {
        default: "text-xs py-1 px-2",
        sm: "text-xs py-0.5 px-1",
        md: "text-sm py-1 px-2",
        lg: "text-base py-2 px-3",
        xl: "text-lg py-3 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
