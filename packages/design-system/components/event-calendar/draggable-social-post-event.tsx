"use client";

import {
  type CalendarEvent,
  useCalendarDnd,
} from "@delulu/design-system/components/event-calendar";
import {
  SocialPostEvent,
  type SocialPostEventData,
} from "@delulu/design-system/components/event-calendar/social-post-event";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { differenceInDays } from "date-fns";
import { useRef, useState } from "react";

interface DraggableSocialPostEventProps {
  event: CalendarEvent & { postData: SocialPostEventData };
  view: "month" | "week" | "day";
  onClick?: () => void;
  height?: number;
  className?: string;
  isMultiDay?: boolean;
  multiDayWidth?: number;
  isFirstDay?: boolean;
  isLastDay?: boolean;
}

export function DraggableSocialPostEvent({
  event,
  view,
  onClick,
  height,
  className,
  isMultiDay,
  multiDayWidth,
  isFirstDay = true,
  isLastDay = true,
}: DraggableSocialPostEventProps) {
  const { activeId } = useCalendarDnd();
  const elementRef = useRef<HTMLDivElement>(null);
  const [dragHandlePosition, setDragHandlePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Check if this is a multi-day event
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  const isMultiDayEvent =
    isMultiDay || event.allDay || differenceInDays(eventEnd, eventStart) >= 1;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${event.id}-${view}`,
      data: {
        event,
        view,
        height: height || elementRef.current?.offsetHeight || null,
        isMultiDay: isMultiDayEvent,
        multiDayWidth,
        dragHandlePosition,
        isFirstDay,
        isLastDay,
      },
    });

  // Handle mouse down to track where on the event the user clicked
  const handleMouseDown = (e: React.MouseEvent) => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      setDragHandlePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Handle touch start to track where on the event the user touched
  const handleTouchStart = (e: React.TouchEvent) => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      if (touch) {
        setDragHandlePosition({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        });
      }
    }
  };

  // Don't render if this event is being dragged
  if (isDragging || activeId === `${event.id}-${view}`) {
    return (
      <div
        className="opacity-0"
        ref={setNodeRef}
        style={{ height: height || "auto" }}
      />
    );
  }

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        height: height || "auto",
        width:
          isMultiDayEvent && multiDayWidth ? `${multiDayWidth}%` : undefined,
      }
    : {
        height: height || "auto",
        width:
          isMultiDayEvent && multiDayWidth ? `${multiDayWidth}%` : undefined,
      };

  return (
    <div
      className="h-full touch-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      ref={(node) => {
        setNodeRef(node);
        if (elementRef) {
          elementRef.current = node;
        }
      }}
      style={style}
      {...listeners}
      {...attributes}
    >
      <SocialPostEvent
        className={className}
        event={event.postData}
        onClick={onClick}
      />
    </div>
  );
}
