"use client";

import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import { Card } from "@delulu/design-system/components/ui/card";
import { Input } from "@delulu/design-system/components/ui/input";
import { Label } from "@delulu/design-system/components/ui/label";
import { Switch } from "@delulu/design-system/components/ui/switch";
import { CalendarDays, Check, Copy, MoveUpRight, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  buildCalendarPostText,
  type CalendarCategory,
  type CalendarCountry,
  filterCalendarOccurrences,
  getCalendarOccurrences,
} from "../_utils/holiday-calendar";

interface HolidayCalendarProps {
  appUrl: string;
  initialCategory?: CalendarCategory;
  initialCountry?: CalendarCountry;
}

const countryLabels: Record<CalendarCountry, string> = {
  global: "Global",
  US: "United States",
  IN: "India",
};

const categoryLabels: Record<CalendarCategory, string> = {
  awareness: "Awareness",
  cultural: "Cultural",
  national: "National",
  seasonal: "Seasonal",
};

const monthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const localIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));

export function HolidayCalendar({
  appUrl,
  initialCategory,
  initialCountry,
}: HolidayCalendarProps) {
  const [today, setToday] = useState(() => new Date());
  const [year, setYear] = useState(today.getFullYear());
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<CalendarCountry | "all">(
    initialCountry ?? "all"
  );
  const [category, setCategory] = useState<CalendarCategory | "all">(
    initialCategory ?? "all"
  );
  const [month, setMonth] = useState<number | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [message, setMessage] = useState("");
  const [copiedAngleId, setCopiedAngleId] = useState<string | null>(null);

  useEffect(() => {
    const nextMidnight = new Date(today);
    nextMidnight.setHours(24, 0, 0, 0);
    const timeout = window.setTimeout(
      () => setToday(new Date()),
      Math.max(1000, nextMidnight.getTime() - Date.now() + 100)
    );

    return () => window.clearTimeout(timeout);
  }, [today]);

  useEffect(() => {
    if (!copiedAngleId) {
      return;
    }

    const timeout = window.setTimeout(() => setCopiedAngleId(null), 1500);
    return () => window.clearTimeout(timeout);
  }, [copiedAngleId]);

  const occurrences = useMemo(() => getCalendarOccurrences(year), [year]);
  const visibleEvents = useMemo(
    () =>
      filterCalendarOccurrences(occurrences, {
        country,
        category,
        month,
        query,
        upcomingFrom: upcomingOnly
          ? localIsoDate(today)
          : fromDate || undefined,
      }),
    [
      category,
      country,
      fromDate,
      month,
      occurrences,
      query,
      today,
      upcomingOnly,
    ]
  );

  const copyText = async (text: string, successMessage: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.append(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setMessage(successMessage);
      return true;
    } catch {
      setMessage("Copy failed. Select the text and copy it manually.");
      return false;
    }
  };

  const copyPostAngle = async (eventId: string, prompt: string) => {
    const copied = await copyText(prompt, "Post angle copied");
    if (copied) {
      setCopiedAngleId(eventId);
    }
  };

  const shareEvent = async (eventName: string, text: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: eventName, text });
        setMessage("Shared event");
        return;
      }
      await copyText(text, "Event copied for sharing");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setMessage("Sharing failed. Copy the event instead.");
    }
  };

  const composerHref = (text: string) => {
    const url = new URL("/post", appUrl);
    url.searchParams.set("text", text);
    return url.toString();
  };

  return (
    <section aria-labelledby="calendar-tool-heading" className="py-2">
      <Card className="gap-0 p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold text-xl" id="calendar-tool-heading">
              Find a date for your next post
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Free, anonymous, and processed entirely in your browser.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="calendar-search">Search occasions</Label>
            <Input
              id="calendar-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Environment, youth, gratitude…"
              value={query}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calendar-year">Year</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              id="calendar-year"
              onChange={(event) => setYear(Number(event.target.value))}
              value={year}
            >
              {Array.from(
                { length: 5 },
                (_, index) => today.getFullYear() - 1 + index
              ).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="calendar-month">Month</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              id="calendar-month"
              onChange={(event) =>
                setMonth(
                  event.target.value === "all"
                    ? "all"
                    : Number(event.target.value)
                )
              }
              value={month}
            >
              <option value="all">All months</option>
              {monthOptions.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="calendar-country">Country or region</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              id="calendar-country"
              onChange={(event) =>
                setCountry(event.target.value as CalendarCountry | "all")
              }
              value={country}
            >
              <option value="all">All available</option>
              <option value="global">Global only</option>
              <option value="US">United States</option>
              <option value="IN">India</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="calendar-category">Category</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              id="calendar-category"
              onChange={(event) =>
                setCategory(event.target.value as CalendarCategory | "all")
              }
              value={category}
            >
              <option value="all">All categories</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="calendar-from-date">From date</Label>
            <Input
              disabled={upcomingOnly}
              id="calendar-from-date"
              onChange={(event) => setFromDate(event.target.value)}
              type="date"
              value={fromDate}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-zinc-950/10 border-t-[1.5px] border-dotted pt-5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Switch
              checked={upcomingOnly}
              id="calendar-upcoming"
              onCheckedChange={setUpcomingOnly}
            />
            <Label htmlFor="calendar-upcoming">Upcoming only</Label>
          </div>
          <p className="text-muted-foreground text-sm tabular-nums">
            {visibleEvents.length}{" "}
            {visibleEvents.length === 1 ? "date" : "dates"}
          </p>
        </div>

        <output
          aria-live="polite"
          className="mt-2 block min-h-5 text-primary text-sm"
        >
          {message}
        </output>
      </Card>

      {visibleEvents.length > 0 ? (
        <div className="relative -mx-4 mt-4 grid border-zinc-950/10 md:grid-cols-2 dark:border-white/10">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 left-1/2 z-10 hidden border-zinc-950/10 border-l-[1.5px] border-dotted md:block dark:border-white/10"
          />
          {visibleEvents.map((event) => {
            const text = buildCalendarPostText(event);
            const angleCopied = copiedAngleId === event.id;
            return (
              <article
                className="min-w-0 border-zinc-950/10 border-b-[1.5px] border-dotted p-4 dark:border-white/10"
                key={event.id}
              >
                <Card className="flex h-full flex-col gap-0 border border-border p-5 shadow-none">
                  <header>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-primary text-sm tabular-nums">
                          {formatDate(event.date)}
                        </p>
                        <h3 className="mt-1 text-balance font-semibold text-lg tracking-tight">
                          {event.name}
                        </h3>
                      </div>
                      <Badge
                        className="shrink-0 rounded-full"
                        variant="secondary"
                      >
                        {categoryLabels[event.category]}
                      </Badge>
                    </div>
                    <p className="mt-3 text-muted-foreground text-sm leading-6">
                      {event.description}
                    </p>
                    <p className="mt-3 text-muted-foreground text-xs">
                      {event.countries
                        .map((value) => countryLabels[value])
                        .join(", ")}
                      <span aria-hidden="true" className="mx-1.5">
                        ·
                      </span>
                      {event.dateKind === "fixed"
                        ? "Fixed date"
                        : "Calculated yearly"}
                    </p>
                  </header>
                  <div className="mt-4 flex items-start gap-3 rounded-lg border border-border/70 bg-muted/30 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
                        Post angle
                      </p>
                      <p className="mt-1 text-sm leading-6">
                        {event.contentPrompt}
                      </p>
                    </div>
                    <Button
                      aria-label={
                        angleCopied
                          ? `Post angle copied for ${event.name}`
                          : `Copy post angle for ${event.name}`
                      }
                      className="shrink-0"
                      onClick={() =>
                        copyPostAngle(event.id, event.contentPrompt)
                      }
                      size="icon"
                      title={angleCopied ? "Copied" : "Copy post angle"}
                      type="button"
                      variant="ghost"
                    >
                      {angleCopied ? (
                        <Check
                          aria-hidden="true"
                          className="size-4 text-emerald-600"
                        />
                      ) : (
                        <Copy aria-hidden="true" className="size-4" />
                      )}
                    </Button>
                  </div>
                  <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                    <Button
                      aria-label={`Share ${event.name}`}
                      className="px-2"
                      onClick={() => shareEvent(event.name, text)}
                      type="button"
                      variant="ghost"
                    >
                      <Share2 aria-hidden="true" className="size-4" />
                      Share
                    </Button>
                    <Button asChild>
                      <a
                        aria-label={`Create a post for ${event.name} in Delulu`}
                        href={composerHref(text)}
                        rel="noreferrer"
                      >
                        Create post
                        <MoveUpRight aria-hidden="true" className="size-4" />
                      </a>
                    </Button>
                  </footer>
                </Card>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-2 rounded-xl border border-dashed p-8 text-center">
          <p className="font-medium">No dates match these filters.</p>
          <p className="mt-1 text-muted-foreground text-sm">
            Try another year, clear the From date, or broaden the country and
            category.
          </p>
        </div>
      )}
    </section>
  );
}
