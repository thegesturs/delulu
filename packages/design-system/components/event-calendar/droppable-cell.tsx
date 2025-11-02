"use client"

import { useDroppable } from "@dnd-kit/core"
import { format } from "date-fns"

import { cn } from "@delulu/design-system/lib/utils"
import { useCalendarDnd } from "@delulu/design-system/components/event-calendar"

interface DroppableCellProps {
  id: string
  date: Date
  time?: number // For week/day views, represents hours (e.g., 9.25 for 9:15)
  children?: React.ReactNode
  className?: string
  onClick?: () => void
}

export function DroppableCell({
  id,
  date,
  time,
  children,
  className,
  onClick,
}: DroppableCellProps) {
  const { activeEvent } = useCalendarDnd()

  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      date,
      time,
    },
  })

  // Format time for display
  const timeText = time !== undefined ? (() => {
    const hours = Math.floor(time)
    const minutes = Math.round((time - hours) * 60)
    const cellDateTime = new Date(date)
    cellDateTime.setHours(hours, minutes, 0, 0)
    return format(cellDateTime, 'h:mm a')
  })() : format(date, 'MMM d')

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "data-dragging:bg-accent group/cell relative flex h-full flex-col overflow-hidden px-0.5 py-1 transition-all sm:px-1",
        "hover:border hover:border-dashed hover:border-primary/50 hover:bg-accent/30 cursor-pointer rounded-sm",
        className
      )}
      data-dragging={isOver && activeEvent ? true : undefined}
    >
      {children}
      {/* Hover indicator with text */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/cell:opacity-100">
        <span className="text-xs font-medium text-foreground/70">
          Create post at {timeText}
        </span>
      </div>
    </div>
  )
}
