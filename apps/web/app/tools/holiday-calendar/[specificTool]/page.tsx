import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { getTool } from "@/lib/tools";
import { HolidayCalendar } from "../_components/holiday-calendar";
import {
  getHolidayCalendarPage,
  holidayCalendarPages,
} from "../_utils/tool-pages";

interface CalendarPageProps {
  params: Promise<{ specificTool: string }>;
}

export const dynamicParams = false;

export const generateStaticParams = () =>
  holidayCalendarPages.map((page) => ({ specificTool: page.slug }));

export async function generateMetadata({
  params,
}: CalendarPageProps): Promise<Metadata> {
  const { specificTool } = await params;
  const page = getHolidayCalendarPage(specificTool);
  if (!page) {
    return {};
  }

  return createMetadata({
    title: page.metadataTitle,
    description: page.description,
    keywords: [...page.keywords],
    image: getWebUrl(
      `/api/og?title=${encodeURIComponent(page.title)}&description=${encodeURIComponent(page.description)}`
    ),
    alternates: {
      canonical: getWebUrl(`/tools/holiday-calendar/${page.slug}`),
    },
    openGraph: {
      type: "website",
      url: getWebUrl(`/tools/holiday-calendar/${page.slug}`),
    },
  });
}

const howToSteps = [
  {
    name: "Choose your planning window",
    text: "Select a year and month, set a From date, or switch on Upcoming only.",
  },
  {
    name: "Narrow the calendar",
    text: "Search by topic and filter by country or category to find a defensible match for your audience.",
  },
  {
    name: "Use the date responsibly",
    text: "Copy or share the planning prompt, or open it in the Delulu composer and rewrite it with specific, sourced context.",
  },
];

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { specificTool } = await params;
  const page = getHolidayCalendarPage(specificTool);
  const tool = getTool(specificTool);
  if (!(page && tool)) {
    notFound();
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://solulu.delulu.social";

  return (
    <ToolPageLayout
      faq={page.faq}
      howToHeading={page.howToHeading}
      howToSteps={howToSteps}
      sections={[
        {
          heading: "How these dates are selected",
          body: (
            <p>
              Dates come from a small, reviewable list of international and
              government sources. Fixed Gregorian dates stay fixed, while
              weekday holidays are recalculated for the year you choose. Country
              labels appear only when the source supports them.
            </p>
          ),
        },
        {
          heading: "Choose dates your audience cares about",
          body: (
            <ul>
              <li>Choose dates that genuinely connect to your audience.</li>
              <li>Use primary sources for claims, themes, and statistics.</li>
              <li>Credit communities and experts whose work you feature.</li>
              <li>Review sensitive topics before scheduling or publishing.</li>
            </ul>
          ),
        },
        {
          heading: "Privacy and date accuracy",
          body: (
            <p>
              Search and filtering happen entirely in your browser. No query or
              selected date is sent to Delulu. The composer opens only when you
              choose Create this post in Delulu. Movable regional and religious
              dates are omitted rather than guessed.
            </p>
          ),
        },
      ]}
      seo={page.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      tool={tool}
    >
      <HolidayCalendar
        appUrl={appUrl}
        initialCategory={page.preset.category}
        initialCountry={page.preset.country}
      />
    </ToolPageLayout>
  );
}
