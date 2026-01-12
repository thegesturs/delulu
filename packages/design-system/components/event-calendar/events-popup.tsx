'use client';

import { format, isSameDay } from 'date-fns';
import { Icon } from '../../providers/icon';
import { Cancel01Icon } from '@hugeicons-pro/core-solid-rounded';
import { useEffect, useMemo, useRef } from 'react';

import {
  type CalendarEvent,
  EventItem,
} from '@delulu/design-system/components/event-calendar';

interface EventsPopupProps {
  date: Date;
  events: CalendarEvent[];
  position: { top: number; left: number };
  onClose: () => void;
  onEventSelect: (event: CalendarEvent) => void;
}

export function EventsPopup({
  date,
  events,
  position,
  onClose,
  onEventSelect,
}: EventsPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle escape key to close popup
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const handleEventClick = (event: CalendarEvent) => {
    onEventSelect(event);
    onClose();
  };

  // Adjust position to ensure popup stays within viewport
  const adjustedPosition = useMemo(() => {
    const positionCopy = { ...position };

    // Check if we need to adjust the position to fit in the viewport
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Adjust horizontally if needed
      if (positionCopy.left + rect.width > viewportWidth) {
        positionCopy.left = Math.max(0, viewportWidth - rect.width);
      }

      // Adjust vertically if needed
      if (positionCopy.top + rect.height > viewportHeight) {
        positionCopy.top = Math.max(0, viewportHeight - rect.height);
      }
    }

    return positionCopy;
  }, [position]);

  return (
    <div
      ref={popupRef}
      className="absolute z-50 max-h-96 w-80 overflow-auto rounded-md border bg-background shadow-lg"
      style={{
        top: `${adjustedPosition.top}px`,
        left: `${adjustedPosition.left}px`,
      }}
    >
      <div className="sticky top-0 flex items-center justify-between border-b bg-background p-3">
        <h3 className="font-medium">{format(date, 'd MMMM yyyy')}</h3>
        <button
          type="submit"
          onClick={onClose}
          className="rounded-full p-1 hover:bg-muted"
          aria-label="Close"
        >
          <Icon icon={Cancel01Icon} size={16} />
        </button>
      </div>

      <div className="space-y-2 p-3">
        {events.length === 0 ? (
          <div className="py-2 text-muted-foreground text-sm">No events</div>
        ) : (
          events.map((event) => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            const isFirstDay = isSameDay(date, eventStart);
            const isLastDay = isSameDay(date, eventEnd);

            return (
              // biome-ignore lint/nursery/noStaticElementInteractions: <explanation>
              <div
                key={event.id}
                onKeyDown={(e) => e.stopPropagation()}
                className="cursor-pointer"
                onClick={() => handleEventClick(event)}
              >
                <EventItem
                  event={event}
                  view="agenda"
                  isFirstDay={isFirstDay}
                  isLastDay={isLastDay}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
