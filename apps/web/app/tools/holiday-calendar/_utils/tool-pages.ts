import type { CalendarCategory, CalendarCountry } from "./holiday-calendar";
import {
  getHolidayCalendarSummary,
  type HolidayCalendarSlug,
  type HolidayCalendarSummary,
} from "./registry";

export type HolidayCalendarPage = HolidayCalendarSummary & {
  intro: string[];
  preset: {
    country?: CalendarCountry;
    category?: CalendarCategory;
  };
  howToHeading: string;
  faq: Array<{ question: string; answer: string }>;
};

const definePage = (
  slug: HolidayCalendarSlug,
  details: Omit<HolidayCalendarPage, keyof HolidayCalendarSummary>
): HolidayCalendarPage => ({
  ...getHolidayCalendarSummary(slug),
  ...details,
});

export const holidayCalendarPages: HolidayCalendarPage[] = [
  definePage("social-media-holiday-calendar", {
    intro: [
      "A useful social media holiday calendar should help you find a relevant occasion without burying you in invented theme days. This calendar starts with a small, sourced set of global observances and national dates for the United States and India.",
      "Choose a year, search by topic, narrow the country or category, or switch to upcoming dates. Fixed dates and annually calculated weekday holidays are labeled so you can review the timing before you plan a post.",
    ],
    preset: {},
    howToHeading: "How to use the social media holiday calendar",
    faq: [
      {
        question: "Is this social media holiday calendar free?",
        answer:
          "Yes. You can search, filter, copy, and share the calendar without an account or usage limit.",
      },
      {
        question: "Where do the calendar dates come from?",
        answer:
          "Dates come from sources such as the United Nations, the World Health Organization, and national government calendars. The source list is maintained with the calendar.",
      },
      {
        question:
          "Why are there fewer dates than in other marketing calendars?",
        answer:
          "The list is intentionally modest. It is more useful to publish a reviewable set of real observances than hundreds of novelty dates with unclear origins.",
      },
      {
        question: "Can I see only upcoming social media holidays?",
        answer:
          "Yes. Turn on Upcoming only to hide dates earlier than today, or set a specific From date for campaign planning.",
      },
      {
        question: "Can I search next year's calendar?",
        answer:
          "Yes. The year control includes future years, and weekday-based dates such as U.S. Thanksgiving are calculated for the selected year.",
      },
      {
        question: "How do I turn a holiday into a post?",
        answer:
          "Use Create this post in Delulu beside an event. The composer opens with the date, occasion, and a responsible starting prompt that you can rewrite for your audience.",
      },
    ],
  }),
  definePage("us-social-media-holiday-calendar", {
    intro: [
      "This U.S. social media calendar combines the federal holiday rules published by the Office of Personnel Management with a focused set of global awareness dates. It uses official federal names where they differ from casual labels.",
      "Dates such as Memorial Day and Thanksgiving are recalculated for every selected year. The calendar shows the actual holiday date, not a substitute weekday that may apply to a particular employer's leave schedule.",
    ],
    preset: { country: "US" },
    howToHeading: "How to plan U.S. holiday social posts",
    faq: [
      {
        question: "Does this include every U.S. state holiday?",
        answer:
          "No. The U.S. view focuses on federal holidays plus selected global observances. State and local dates vary and should be checked with the relevant authority.",
      },
      {
        question: "Why does the calendar say Washington's Birthday?",
        answer:
          "Washington's Birthday is the official federal holiday name used by the U.S. Office of Personnel Management, even though other names are common.",
      },
      {
        question: "How is U.S. Thanksgiving calculated?",
        answer:
          "Thanksgiving is shown on the fourth Thursday in November for the year you select.",
      },
      {
        question: "Does an observed federal day replace the holiday date here?",
        answer:
          "No. This content-planning calendar uses the named calendar date or weekday rule. Employer closures and in-lieu leave days can differ.",
      },
      {
        question: "Are global awareness days included in the U.S. filter?",
        answer:
          "Yes. Global observances remain visible because they can still be relevant to a U.S. audience; choose a category to narrow the list.",
      },
      {
        question: "Can I draft a respectful Memorial Day post?",
        answer:
          "The composer handoff supplies a restrained prompt, but you should still review tone, avoid promotional framing, and verify any historical claims.",
      },
    ],
  }),
  definePage("india-social-media-holiday-calendar", {
    intro: [
      "The India calendar begins with three fixed national dates—Republic Day, Independence Day, and Gandhi Jayanti—plus sourced global observances. It deliberately excludes movable religious and regional holidays until an authoritative annual date can be reviewed.",
      "That smaller scope keeps the page useful and honest across years. Use it as a planning baseline, then confirm state, community, and organization-specific calendars before scheduling local campaigns.",
    ],
    preset: { country: "IN" },
    howToHeading: "How to plan social content for dates in India",
    faq: [
      {
        question: "Which Indian national dates are included?",
        answer:
          "The current calendar includes Republic Day on January 26, Independence Day on August 15, and Gandhi Jayanti on October 2.",
      },
      {
        question: "Why are Diwali and Holi not listed?",
        answer:
          "Their Gregorian dates move and require an authoritative annual calendar. This calendar does not guess movable dates or repeat one year's date in another year.",
      },
      {
        question: "Does the India view include regional holidays?",
        answer:
          "No. State and regional calendars vary substantially. Check the appropriate government notification before planning local operational messages.",
      },
      {
        question: "Are the India dates fixed every year?",
        answer:
          "The three national dates currently included use fixed Gregorian dates. Their weekday changes from year to year, but the month and day do not.",
      },
      {
        question: "Why do global awareness dates appear in this view?",
        answer:
          "Global observances can be relevant to audiences in India. You can switch the country control to Global or narrow by category at any time.",
      },
      {
        question: "Can the post prompt be localized?",
        answer:
          "Yes. Create this post in Delulu gives you a factual starting point in the composer; adapt the language, context, and tone for the community you serve.",
      },
    ],
  }),
  definePage("social-media-awareness-days-calendar", {
    intro: [
      "Awareness-day content works best when the date is real and the post adds something useful. This calendar focuses on observances documented by the United Nations and World Health Organization, with a small number of other widely established dates.",
      "Each result includes a practical prompt, but it is only a starting point. Use primary sources, credit people whose work you feature, and avoid turning sensitive causes into empty engagement hooks.",
    ],
    preset: { category: "awareness" },
    howToHeading: "How to use awareness days in social content",
    faq: [
      {
        question: "What counts as an awareness day in this calendar?",
        answer:
          "The category primarily includes public-interest observances documented by authoritative international organizations, such as health, environment, and rights-focused days.",
      },
      {
        question: "Does every awareness day need a brand post?",
        answer:
          "No. Publish only when the topic connects honestly to your work, audience, or a concrete action you can support.",
      },
      {
        question: "How should I write about health awareness dates?",
        answer:
          "Use current information from trusted health authorities, avoid diagnosis or stigma, and include a useful resource when appropriate.",
      },
      {
        question: "Can I copy an awareness-day prompt?",
        answer:
          "Yes. Copy gives you the occasion, date, and planning prompt. Rewrite it with specific facts and your own context before publishing.",
      },
      {
        question: "Are annual campaign themes included?",
        answer:
          "No. Campaign themes can change each year. The static calendar stores durable dates and links its provenance so themes can be checked at the source.",
      },
      {
        question: "How far ahead should I plan awareness content?",
        answer:
          "A few weeks is often enough for research and review, while partnerships or original reporting may need a longer lead time. Use the From date filter to build that window.",
      },
    ],
  }),
  definePage("seasonal-content-calendar", {
    intro: [
      "Seasonal planning should work in January and October alike. This calendar lets you change the year, reveal upcoming dates, and search a concise set of recurring cultural moments instead of presenting a one-month campaign list.",
      "Use the dates as editorial anchors, not obligations. A useful seasonal post still needs a clear audience benefit, an on-brand angle, and enough lead time for creative review.",
    ],
    preset: { category: "seasonal" },
    howToHeading: "How to build an evergreen seasonal content plan",
    faq: [
      {
        question: "What is a seasonal social media content calendar?",
        answer:
          "It is a planning view of recurring moments that can shape timely posts, campaigns, service notices, or community messages throughout the year.",
      },
      {
        question: "Will this calendar still work after the current season?",
        answer:
          "Yes. Select another year or clear Upcoming only to review the full annual cycle at any time.",
      },
      {
        question: "How early should a seasonal campaign start?",
        answer:
          "Simple posts may need days, while production, approvals, or paid campaigns may need weeks. Work backward from the displayed date based on your process.",
      },
      {
        question: "Should every seasonal post be promotional?",
        answer:
          "No. Appreciation, education, service updates, and community stories often serve audiences better than a sale.",
      },
      {
        question: "Can I share a seasonal date with my team?",
        answer:
          "Yes. Share uses your device's share sheet when available and otherwise copies the event details to the clipboard.",
      },
      {
        question: "Can I use the calendar without creating an account?",
        answer:
          "Yes. All filtering and copy/share actions run in your browser. An account is needed only if you choose to continue into the Delulu composer.",
      },
    ],
  }),
];

export const getHolidayCalendarPage = (slug: string) =>
  holidayCalendarPages.find((page) => page.slug === slug);
