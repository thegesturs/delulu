"use client";

import {
  AgendaDaysToShow,
  AgendaView,
  CalendarDndProvider,
  type CalendarEvent,
  type CalendarView,
  DayView,
  EventDialog,
  EventGap,
  EventHeight,
  MonthView,
  WeekCellsHeight,
  WeekView,
} from "@delulu/design-system/components/event-calendar";
import { Button } from "@delulu/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@delulu/design-system/components/ui/dropdown-menu";
import { cn } from "@delulu/design-system/lib/utils";
import {
  Add01Icon,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "@hugeicons-pro/core-solid-rounded";
import {
  addDays,
  addHours,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Icon } from "../../providers/icon";

export interface EventCalendarProps {
  events?: CalendarEvent[];
  onEventAdd?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  onEventCreate?: (startTime: Date) => void; // Custom handler for creating events (overrides default dialog)
  onEventSelect?: (event: CalendarEvent) => void; // Custom handler for selecting events (overrides default dialog)
  className?: string;
  initialView?: CalendarView;
}

export function EventCalendar({
  events = [],
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  onEventCreate: customOnEventCreate,
  onEventSelect: customOnEventSelect,
  className,
  initialView = "month",
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(initialView);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );

  // Add keyboard shortcuts for view switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input, textarea or contentEditable element
      // or if the event dialog is open
      if (
        isEventDialogOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "m":
          setView("month");
          break;
        case "w":
          setView("week");
          break;
        case "d":
          setView("day");
          break;
        case "a":
          setView("agenda");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEventDialogOpen]);

  const handlePrevious = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (view === "day") {
      setCurrentDate(addDays(currentDate, -1));
    } else if (view === "agenda") {
      // For agenda view, go back 30 days (a full month)
      setCurrentDate(addDays(currentDate, -AgendaDaysToShow));
    }
  };

  const handleNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (view === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === "agenda") {
      // For agenda view, go forward 30 days (a full month)
      setCurrentDate(addDays(currentDate, AgendaDaysToShow));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventSelect = (event: CalendarEvent) => {
    console.log("Event selected:", event); // Debug log

    // If custom handler provided, use it instead of opening dialog
    if (customOnEventSelect) {
      customOnEventSelect(event);
      return;
    }

    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleEventCreate = (startTime: Date) => {
    console.log("Creating new event at:", startTime); // Debug log

    // If custom handler provided, use it instead of opening dialog
    if (customOnEventCreate) {
      customOnEventCreate(startTime);
      return;
    }

    // Snap to 15-minute intervals
    const minutes = startTime.getMinutes();
    const remainder = minutes % 15;
    if (remainder !== 0) {
      if (remainder < 7.5) {
        // Round down to nearest 15 min
        startTime.setMinutes(minutes - remainder);
      } else {
        // Round up to nearest 15 min
        startTime.setMinutes(minutes + (15 - remainder));
      }
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);
    }

    const newEvent: CalendarEvent = {
      id: "",
      title: "",
      start: startTime,
      end: addHours(startTime, 1),
      allDay: false,
    };
    setSelectedEvent(newEvent);
    setIsEventDialogOpen(true);
  };

  const handleEventSave = (event: CalendarEvent) => {
    if (event.id) {
      onEventUpdate?.(event);
      // Show toast notification when an event is updated
      toast(`Event "${event.title}" updated`, {
        description: format(new Date(event.start), "MMM d, yyyy"),
        position: "bottom-left",
      });
    } else {
      onEventAdd?.({
        ...event,
        id: Math.random().toString(36).substring(2, 11),
      });
      // Show toast notification when an event is added
      toast(`Event "${event.title}" added`, {
        description: format(new Date(event.start), "MMM d, yyyy"),
        position: "bottom-left",
      });
    }
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleEventDelete = (eventId: string) => {
    const deletedEvent = events.find((e) => e.id === eventId);
    onEventDelete?.(eventId);
    setIsEventDialogOpen(false);
    setSelectedEvent(null);

    // Show toast notification when an event is deleted
    if (deletedEvent) {
      toast(`Event "${deletedEvent.title}" deleted`, {
        description: format(new Date(deletedEvent.start), "MMM d, yyyy"),
        position: "bottom-left",
      });
    }
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    onEventUpdate?.(updatedEvent);
  };

  const viewTitle = useMemo(() => {
    if (view === "month") {
      return format(currentDate, "MMMM yyyy");
    }
    if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      if (isSameMonth(start, end)) {
        return format(start, "MMMM yyyy");
      }
      return `${format(start, "MMM")} - ${format(end, "MMM yyyy")}`;
    }
    if (view === "day") {
      return (
        <>
          <span aria-hidden="true" className="min-[480px]:hidden">
            {format(currentDate, "MMM d, yyyy")}
          </span>
          <span aria-hidden="true" className="max-[479px]:hidden min-md:hidden">
            {format(currentDate, "MMMM d, yyyy")}
          </span>
          <span className="max-md:hidden">
            {format(currentDate, "EEE MMMM d, yyyy")}
          </span>
        </>
      );
    }
    if (view === "agenda") {
      // Show the month range for agenda view
      const start = currentDate;
      const end = addDays(currentDate, AgendaDaysToShow - 1);

      if (isSameMonth(start, end)) {
        return format(start, "MMMM yyyy");
      }
      return `${format(start, "MMM")} - ${format(end, "MMM yyyy")}`;
    }
    return format(currentDate, "MMMM yyyy");
  }, [currentDate, view]);

  return (
    <div
      className="flex flex-col rounded-lg border has-data-[slot=month-view]:flex-1"
      style={
        {
          "--event-height": `${EventHeight}px`,
          "--event-gap": `${EventGap}px`,
          "--week-cells-height": `${WeekCellsHeight}px`,
        } as React.CSSProperties
      }
    >
      <CalendarDndProvider onEventUpdate={handleEventUpdate}>
        <div
          className={cn(
            "flex items-center justify-between p-2 sm:p-4",
            className
          )}
        >
          <div className="flex items-center gap-1 sm:gap-4">
            <Button
              className="max-[479px]:aspect-square max-[479px]:p-0!"
              onClick={handleToday}
              variant="outline"
            >
              <Icon
                aria-hidden="true"
                className="min-[480px]:hidden"
                icon={CalendarCheck}
                size={16}
              />
              <span className="max-[479px]:sr-only">Today</span>
            </Button>
            <div className="flex items-center sm:gap-2">
              <Button
                aria-label="Previous"
                onClick={handlePrevious}
                size="icon"
                variant="ghost"
              >
                <Icon aria-hidden="true" icon={ChevronLeft} size={16} />
              </Button>
              <Button
                aria-label="Next"
                onClick={handleNext}
                size="icon"
                variant="ghost"
              >
                <Icon aria-hidden="true" icon={ChevronRight} size={16} />
              </Button>
            </div>
            <h2 className="font-semibold text-sm sm:text-lg md:text-xl">
              {viewTitle}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-1.5 max-[479px]:h-8" variant="outline">
                  <span>
                    <span aria-hidden="true" className="min-[480px]:hidden">
                      {view.charAt(0).toUpperCase()}
                    </span>
                    <span className="max-[479px]:sr-only">
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </span>
                  </span>
                  <Icon
                    aria-hidden="true"
                    className="-me-1 opacity-60"
                    icon={ChevronDown}
                    size={16}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-32">
                <DropdownMenuItem onClick={() => setView("month")}>
                  Month <DropdownMenuShortcut>M</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("week")}>
                  Week <DropdownMenuShortcut>W</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("day")}>
                  Day <DropdownMenuShortcut>D</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("agenda")}>
                  Agenda <DropdownMenuShortcut>A</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {!customOnEventCreate && (
              <Button
                className="max-[479px]:aspect-square max-[479px]:p-0!"
                onClick={() => {
                  setSelectedEvent(null); // Ensure we're creating a new event
                  setIsEventDialogOpen(true);
                }}
              >
                <Icon
                  aria-hidden="true"
                  className="opacity-60 sm:-ms-1"
                  icon={Add01Icon}
                  size={16}
                />
                <span className="max-sm:sr-only">New event</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          {view === "month" && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onEventCreate={handleEventCreate}
              onEventSelect={handleEventSelect}
            />
          )}
          {view === "week" && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onEventCreate={handleEventCreate}
              onEventSelect={handleEventSelect}
            />
          )}
          {view === "day" && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventCreate={handleEventCreate}
              onEventSelect={handleEventSelect}
            />
          )}
          {view === "agenda" && (
            <AgendaView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
            />
          )}
        </div>

        <EventDialog
          event={selectedEvent}
          isOpen={isEventDialogOpen}
          onClose={() => {
            setIsEventDialogOpen(false);
            setSelectedEvent(null);
          }}
          onDelete={handleEventDelete}
          onSave={handleEventSave}
        />
      </CalendarDndProvider>
    </div>
  );
}
