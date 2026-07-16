import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { getTool } from "@/lib/tools";
import { FeedPlanner } from "./feed-planner";
import type { FeedPlannerPageDefinition } from "./feed-planner-pages";

const DEFAULT_APP_ORIGIN = "https://solulu.delulu.social";

export const createFeedPlannerMetadata = (
  definition: FeedPlannerPageDefinition
): Metadata => {
  const canonical = getWebUrl(`/tools/feed-planners/${definition.slug}`);
  return createMetadata({
    title: definition.metaTitle,
    description: definition.metaDescription,
    keywords: definition.keywords,
    image: getWebUrl(
      `/api/og?title=${encodeURIComponent(definition.title)}&description=${encodeURIComponent(definition.description)}`
    ),
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${definition.metaTitle} | Delulu Social`,
      description: definition.metaDescription,
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: definition.metaTitle,
      description: definition.metaDescription,
    },
  });
};

export function FeedPlannerPage({
  definition,
}: {
  definition: FeedPlannerPageDefinition;
}) {
  const tool = getTool(definition.slug);
  if (!tool) {
    throw new Error(`Feed planner tool is not registered: ${definition.slug}`);
  }

  const composerUrl = new URL(
    "/post",
    process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_ORIGIN
  ).href;

  const sections = definition.sections.map((section) => ({
    heading: section.heading,
    body: section.paragraphs.map((paragraph) => (
      <p key={paragraph}>{paragraph}</p>
    )),
  }));

  return (
    <ToolPageLayout
      faq={definition.faq}
      howToHeading={definition.howToHeading}
      howToSteps={definition.howToSteps}
      relatedHeading={definition.relatedHeading}
      relatedSlugs={definition.relatedSlugs}
      sections={sections}
      seo={definition.intro.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      tool={tool}
    >
      <FeedPlanner composerUrl={composerUrl} variant={definition.variant} />
    </ToolPageLayout>
  );
}
