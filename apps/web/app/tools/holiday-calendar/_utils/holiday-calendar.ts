export type CalendarCountry = "global" | "US" | "IN";
export type CalendarCategory =
  | "awareness"
  | "cultural"
  | "national"
  | "seasonal";

interface FixedDateRule {
  type: "fixed";
  month: number;
  day: number;
}

interface WeekdayDateRule {
  type: "weekday";
  month: number;
  weekday: number;
  ordinal: number | "last";
}

export type CalendarDateRule = FixedDateRule | WeekdayDateRule;

export interface CalendarEventDefinition {
  id: string;
  name: string;
  description: string;
  countries: CalendarCountry[];
  category: CalendarCategory;
  rule: CalendarDateRule;
  sourceId: keyof typeof calendarSources;
  contentPrompt: string;
}

export interface CalendarOccurrence extends CalendarEventDefinition {
  date: string;
  dateKind: "fixed" | "annually-calculated";
}

export interface CalendarFilters {
  country?: CalendarCountry | "all";
  category?: CalendarCategory | "all";
  query?: string;
  month?: number | "all";
  upcomingFrom?: string;
}

/**
 * Reviewable source registry for the deliberately small dataset below.
 * Keep sources authoritative and dates rule-based. See
 * `../DATA_SOURCES.md` for inclusion and review policy.
 */
export const calendarSources = {
  unObservances: {
    name: "United Nations — International Days and Weeks",
    url: "https://www.un.org/en/observances/list-days-weeks",
  },
  whoMentalHealth: {
    name: "World Health Organization — World Mental Health Day",
    url: "https://www.who.int/campaigns/world-mental-health-day",
  },
  usFederal: {
    name: "U.S. Office of Personnel Management — Federal Holidays",
    url: "https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/",
  },
  indiaNational: {
    name: "National Portal of India — national holiday publications",
    url: "https://www.india.gov.in/calendar",
  },
  newYearCalendar: {
    name: "New Year's Day calendar reference",
    url: "https://www.timeanddate.com/holidays/common/new-year-day",
  },
  valentineCalendar: {
    name: "Valentine's Day calendar reference",
    url: "https://www.timeanddate.com/holidays/common/valentine-day",
  },
  earthDayCalendar: {
    name: "Earth Day calendar reference",
    url: "https://www.timeanddate.com/holidays/common/earth-day",
  },
  halloweenCalendar: {
    name: "Halloween calendar reference",
    url: "https://www.timeanddate.com/holidays/common/halloween",
  },
  christmasCalendar: {
    name: "Christmas Day calendar reference",
    url: "https://www.timeanddate.com/holidays/common/christmas-day",
  },
} as const;

const fixed = (month: number, day: number): FixedDateRule => ({
  type: "fixed",
  month,
  day,
});

const weekday = (
  month: number,
  dayOfWeek: number,
  ordinal: number | "last"
): WeekdayDateRule => ({
  type: "weekday",
  month,
  weekday: dayOfWeek,
  ordinal,
});

export const calendarEvents: CalendarEventDefinition[] = [
  {
    id: "new-years-day",
    name: "New Year's Day",
    description: "A practical moment for goals, recaps, and fresh-start posts.",
    countries: ["global"],
    category: "seasonal",
    rule: fixed(1, 1),
    sourceId: "newYearCalendar",
    contentPrompt:
      "Share one useful goal, lesson, or fresh start for the year.",
  },
  {
    id: "valentines-day",
    name: "Valentine's Day",
    description: "A widely used seasonal date for appreciation-led content.",
    countries: ["global"],
    category: "seasonal",
    rule: fixed(2, 14),
    sourceId: "valentineCalendar",
    contentPrompt: "Thank the people or community who make your work possible.",
  },
  {
    id: "international-womens-day",
    name: "International Women's Day",
    description:
      "A UN-recognized day focused on women's rights and achievements.",
    countries: ["global"],
    category: "awareness",
    rule: fixed(3, 8),
    sourceId: "unObservances",
    contentPrompt: "Highlight a specific contribution by women in your field.",
  },
  {
    id: "world-water-day",
    name: "World Water Day",
    description: "A UN observance for water access and sustainable management.",
    countries: ["global"],
    category: "awareness",
    rule: fixed(3, 22),
    sourceId: "unObservances",
    contentPrompt: "Connect water stewardship to one concrete action or fact.",
  },
  {
    id: "earth-day",
    name: "Earth Day",
    description:
      "A global environmental moment suited to specific, credible action.",
    countries: ["global"],
    category: "awareness",
    rule: fixed(4, 22),
    sourceId: "earthDayCalendar",
    contentPrompt:
      "Share one measurable environmental action, not a vague promise.",
  },
  {
    id: "world-environment-day",
    name: "World Environment Day",
    description: "The UN's annual day for environmental awareness and action.",
    countries: ["global"],
    category: "awareness",
    rule: fixed(6, 5),
    sourceId: "unObservances",
    contentPrompt:
      "Explain one environmental improvement your audience can make.",
  },
  {
    id: "international-youth-day",
    name: "International Youth Day",
    description:
      "A UN observance centered on young people's priorities and agency.",
    countries: ["global"],
    category: "awareness",
    rule: fixed(8, 12),
    sourceId: "unObservances",
    contentPrompt:
      "Center a young person's perspective, work, or idea with credit.",
  },
  {
    id: "international-day-of-peace",
    name: "International Day of Peace",
    description: "A UN observance encouraging peace through practical action.",
    countries: ["global"],
    category: "awareness",
    rule: fixed(9, 21),
    sourceId: "unObservances",
    contentPrompt:
      "Share a grounded example of dialogue, repair, or cooperation.",
  },
  {
    id: "world-mental-health-day",
    name: "World Mental Health Day",
    description: "A WHO campaign day for mental-health awareness and support.",
    countries: ["global"],
    category: "awareness",
    rule: fixed(10, 10),
    sourceId: "whoMentalHealth",
    contentPrompt:
      "Share a responsible resource or supportive workplace practice.",
  },
  {
    id: "halloween",
    name: "Halloween",
    description:
      "A seasonal creative hook used across many English-speaking markets.",
    countries: ["global"],
    category: "seasonal",
    rule: fixed(10, 31),
    sourceId: "halloweenCalendar",
    contentPrompt: "Use a playful format that still sounds like your brand.",
  },
  {
    id: "world-aids-day",
    name: "World AIDS Day",
    description:
      "A global health observance for awareness, solidarity, and action.",
    countries: ["global"],
    category: "awareness",
    rule: fixed(12, 1),
    sourceId: "unObservances",
    contentPrompt:
      "Use a trusted health source and avoid stigmatizing language.",
  },
  {
    id: "christmas-day",
    name: "Christmas Day",
    description: "A major cultural and seasonal date in many markets.",
    countries: ["global"],
    category: "seasonal",
    rule: fixed(12, 25),
    sourceId: "christmasCalendar",
    contentPrompt:
      "Share a warm, audience-appropriate message or service update.",
  },
  {
    id: "us-mlk-day",
    name: "Birthday of Martin Luther King, Jr.",
    description: "A U.S. federal holiday on the third Monday in January.",
    countries: ["US"],
    category: "national",
    rule: weekday(1, 1, 3),
    sourceId: "usFederal",
    contentPrompt:
      "Use primary historical sources and connect words to action.",
  },
  {
    id: "us-washington-birthday",
    name: "Washington's Birthday",
    description: "The official name of the U.S. federal February holiday.",
    countries: ["US"],
    category: "national",
    rule: weekday(2, 1, 3),
    sourceId: "usFederal",
    contentPrompt:
      "Keep the official holiday name and make the post audience-relevant.",
  },
  {
    id: "us-memorial-day",
    name: "Memorial Day",
    description: "A U.S. federal holiday on the last Monday in May.",
    countries: ["US"],
    category: "national",
    rule: weekday(5, 1, "last"),
    sourceId: "usFederal",
    contentPrompt: "Use a respectful tone and avoid promotional framing.",
  },
  {
    id: "us-juneteenth",
    name: "Juneteenth National Independence Day",
    description: "A U.S. federal holiday observed on June 19.",
    countries: ["US"],
    category: "national",
    rule: fixed(6, 19),
    sourceId: "usFederal",
    contentPrompt:
      "Center accurate history and Black voices rather than a promotion.",
  },
  {
    id: "us-independence-day",
    name: "Independence Day",
    description: "The U.S. national holiday dated July 4.",
    countries: ["US"],
    category: "national",
    rule: fixed(7, 4),
    sourceId: "usFederal",
    contentPrompt:
      "Match the tone to your U.S. audience and publishing context.",
  },
  {
    id: "us-labor-day",
    name: "Labor Day",
    description: "A U.S. federal holiday on the first Monday in September.",
    countries: ["US"],
    category: "national",
    rule: weekday(9, 1, 1),
    sourceId: "usFederal",
    contentPrompt:
      "Recognize workers with a concrete story, benefit, or commitment.",
  },
  {
    id: "us-veterans-day",
    name: "Veterans Day",
    description: "A U.S. federal holiday dated November 11.",
    countries: ["US"],
    category: "national",
    rule: fixed(11, 11),
    sourceId: "usFederal",
    contentPrompt:
      "Use a respectful message and verify any support resources you cite.",
  },
  {
    id: "us-thanksgiving",
    name: "Thanksgiving Day",
    description: "A U.S. federal holiday on the fourth Thursday in November.",
    countries: ["US"],
    category: "cultural",
    rule: weekday(11, 4, 4),
    sourceId: "usFederal",
    contentPrompt:
      "Thank your community specifically and avoid a generic sales post.",
  },
  {
    id: "india-republic-day",
    name: "Republic Day",
    description: "India's national Republic Day on January 26.",
    countries: ["IN"],
    category: "national",
    rule: fixed(1, 26),
    sourceId: "indiaNational",
    contentPrompt:
      "Use accurate civic context and write for your audience in India.",
  },
  {
    id: "india-independence-day",
    name: "Independence Day (India)",
    description: "India's Independence Day on August 15.",
    countries: ["IN"],
    category: "national",
    rule: fixed(8, 15),
    sourceId: "indiaNational",
    contentPrompt:
      "Use accurate historical context and an audience-appropriate tone.",
  },
  {
    id: "india-gandhi-jayanti",
    name: "Gandhi Jayanti",
    description: "India's national observance on October 2.",
    countries: ["IN"],
    category: "national",
    rule: fixed(10, 2),
    sourceId: "indiaNational",
    contentPrompt:
      "Choose a specific, sourced idea and avoid decontextualized quotes.",
  },
];

const pad = (value: number) => String(value).padStart(2, "0");

const resolveRule = (year: number, rule: CalendarDateRule): string => {
  if (rule.type === "fixed") {
    return `${year}-${pad(rule.month)}-${pad(rule.day)}`;
  }

  if (rule.ordinal === "last") {
    const lastDay = new Date(Date.UTC(year, rule.month, 0));
    const offset = (lastDay.getUTCDay() - rule.weekday + 7) % 7;
    return `${year}-${pad(rule.month)}-${pad(lastDay.getUTCDate() - offset)}`;
  }

  const firstDay = new Date(Date.UTC(year, rule.month - 1, 1));
  const firstMatch = 1 + ((rule.weekday - firstDay.getUTCDay() + 7) % 7);
  const day = firstMatch + (rule.ordinal - 1) * 7;
  return `${year}-${pad(rule.month)}-${pad(day)}`;
};

export const getCalendarOccurrences = (year: number): CalendarOccurrence[] =>
  calendarEvents
    .map<CalendarOccurrence>((event) => ({
      ...event,
      date: resolveRule(year, event.rule),
      dateKind: event.rule.type === "fixed" ? "fixed" : "annually-calculated",
    }))
    .sort((left, right) => left.date.localeCompare(right.date));

export const filterCalendarOccurrences = (
  occurrences: CalendarOccurrence[],
  filters: CalendarFilters
): CalendarOccurrence[] => {
  const query = filters.query?.trim().toLocaleLowerCase();

  return occurrences.filter((event) => {
    const matchesCountry =
      !filters.country ||
      filters.country === "all" ||
      event.countries.includes("global") ||
      event.countries.includes(filters.country);
    const matchesCategory =
      !filters.category ||
      filters.category === "all" ||
      event.category === filters.category;
    const matchesMonth =
      !filters.month ||
      filters.month === "all" ||
      Number(event.date.slice(5, 7)) === filters.month;
    const matchesUpcoming =
      !filters.upcomingFrom || event.date >= filters.upcomingFrom;
    const matchesQuery =
      !query ||
      `${event.name} ${event.description} ${event.contentPrompt}`
        .toLocaleLowerCase()
        .includes(query);

    return (
      matchesCountry &&
      matchesCategory &&
      matchesMonth &&
      matchesUpcoming &&
      matchesQuery
    );
  });
};

export const buildCalendarPostText = (event: CalendarOccurrence): string =>
  `${event.name} is on ${event.date}. ${event.contentPrompt}`;
