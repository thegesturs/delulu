export const holidayCalendarRegistry = [
  {
    slug: "social-media-holiday-calendar",
    title: "Social Media Holiday Calendar",
    metadataTitle: "Free Social Media Holiday Calendar",
    description:
      "Search a reviewable calendar of high-confidence holidays and awareness days, filter by date or market, and turn an occasion into a social post.",
    keywords: [
      "social media holiday calendar",
      "content calendar holidays",
      "social media awareness days",
    ],
  },
  {
    slug: "us-social-media-holiday-calendar",
    title: "U.S. Social Media Holiday Calendar",
    metadataTitle: "U.S. Social Media Holiday Calendar",
    description:
      "Plan U.S. social content with federal holidays and useful global observances, including calculated weekday dates and composer-ready prompts.",
    keywords: [
      "US social media holiday calendar",
      "American content calendar",
      "US federal holiday social posts",
    ],
  },
  {
    slug: "india-social-media-holiday-calendar",
    title: "India Social Media Holiday Calendar",
    metadataTitle: "India Social Media Holiday Calendar",
    description:
      "Find high-confidence national dates for India alongside global awareness days, then filter, copy, share, or start a social post.",
    keywords: [
      "India social media holiday calendar",
      "India content calendar",
      "Indian national day social posts",
    ],
  },
  {
    slug: "social-media-awareness-days-calendar",
    title: "Social Media Awareness Days Calendar",
    metadataTitle: "Social Media Awareness Days Calendar",
    description:
      "Browse a sourced set of global awareness days for social media, search by cause, and start a responsible post without signup.",
    keywords: [
      "social media awareness days calendar",
      "awareness day content calendar",
      "global observances social posts",
    ],
  },
  {
    slug: "seasonal-content-calendar",
    title: "Seasonal Social Media Content Calendar",
    metadataTitle: "Free Seasonal Social Media Content Calendar",
    description:
      "Plan evergreen seasonal social posts across the year with searchable dates, practical prompts, copy/share actions, and composer handoff.",
    keywords: [
      "seasonal social media calendar",
      "seasonal content calendar",
      "holiday campaign planner",
    ],
  },
] as const;

export type HolidayCalendarSummary = (typeof holidayCalendarRegistry)[number];
export type HolidayCalendarSlug = HolidayCalendarSummary["slug"];

export const getHolidayCalendarSummary = (slug: HolidayCalendarSlug) => {
  const summary = holidayCalendarRegistry.find((page) => page.slug === slug);
  if (!summary) {
    throw new Error(`Unknown social calendar: ${slug}`);
  }
  return summary;
};
