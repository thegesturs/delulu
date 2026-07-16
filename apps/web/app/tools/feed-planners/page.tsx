import {
  type BreadcrumbList,
  type ItemList,
  JsonLd,
  type WithContext,
} from "@delulu/seo/json-ld";
import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { ToolCard } from "@/components/tools/tool-card";
import { ToolFaq } from "@/components/tools/tool-faq";
import { tools } from "@/lib/tools";

const FAMILY_PATH = "/tools/feed-planners";
const familyTools = tools.filter((tool) => tool.family?.href === FAMILY_PATH);

export const metadata: Metadata = createMetadata({
  title: "Free Feed Planner – Preview Your Social Posts",
  description:
    "Arrange photos and videos before you post. Preview an Instagram-style grid or a scrolling social feed privately in your browser, free with no signup.",
  alternates: {
    canonical: getWebUrl(FAMILY_PATH),
  },
  image: getWebUrl(
    `/api/og?title=${encodeURIComponent("Preview your feed before you post")}&description=${encodeURIComponent("Arrange photos and videos in a grid or scrolling feed")}`
  ),
  openGraph: {
    title: "Free Feed Planner – Preview Your Social Posts | Delulu Social",
    description:
      "Arrange photos and videos before you post. Preview a profile grid or scrolling social feed privately in your browser.",
    type: "website",
    url: getWebUrl(FAMILY_PATH),
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Feed Planner – Preview Your Social Posts",
    description:
      "Arrange photos and videos in a profile grid or scrolling feed before you publish.",
  },
});

const itemListSchema: WithContext<ItemList> = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Choose how to preview your social feed",
  itemListElement: familyTools.map((tool, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: tool.title,
    description: tool.description,
    url: getWebUrl(tool.href),
  })),
};

const breadcrumbSchema: WithContext<BreadcrumbList> = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Free creator tools",
      item: getWebUrl("/tools"),
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Feed Planning",
      item: getWebUrl(FAMILY_PATH),
    },
  ],
};

const faq = [
  {
    question: "What is a visual feed planner?",
    answer:
      "A visual feed planner lets you arrange upcoming photos and videos before publishing, so you can review sequence, variety, color balance, and campaign pacing.",
  },
  {
    question: "Which feed planner layout should I choose?",
    answer:
      "Use the three-column grid when profile aesthetics matter. Use the vertical feed when you want to judge one-post-at-a-time pacing and mixed-format variety.",
  },
  {
    question: "Are these feed planners free?",
    answer:
      "Yes. Both feed previews work without signup, watermarks, visible rate limits, or a paid plan.",
  },
  {
    question: "Do my photos and videos leave my browser?",
    answer:
      "No. Your photos and videos are displayed with temporary browser previews and are never uploaded while you arrange them.",
  },
  {
    question: "Can I plan image and video posts together?",
    answer:
      "Yes. Both planners accept local image and video files, and you can arrange the formats together in one sequence.",
  },
  {
    question: "Can I move a feed plan into Delulu?",
    answer:
      "Yes. Select the content you want and open its ordered plan in the Delulu composer, then add the original media and finish the post there.",
  },
  {
    question: "Do the planners publish automatically?",
    answer:
      "No. They are private visual workspaces. Publishing and scheduling only happen after you deliberately continue in the composer.",
  },
];

export default function FeedPlannersPage() {
  return (
    <main className="mx-auto w-full max-w-7xl border-border border-x border-dashed px-4 py-12 sm:py-16">
      <JsonLd code={itemListSchema} />
      <JsonLd code={breadcrumbSchema} />

      <nav
        aria-label="Breadcrumb"
        className="mb-6 text-muted-foreground text-sm"
      >
        <Link className="hover:text-foreground" href="/tools">
          Free creator tools
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Feed Planning</span>
      </nav>

      <div className="mx-auto mb-12 max-w-3xl text-center">
        <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
          <Balancer>Preview your feed before you post</Balancer>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground leading-8">
          <Balancer>
            Arrange photos and videos in the view that matters: a three-column
            profile grid or the scrolling feed your audience sees post by post.
          </Balancer>
        </p>
      </div>

      <section aria-labelledby="feed-planner-list">
        <h2
          className="mb-5 font-bold text-2xl tracking-tight"
          id="feed-planner-list"
        >
          How do you want to preview your posts?
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {familyTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="prose prose-neutral dark:prose-invert mx-auto mt-16 max-w-2xl">
        <h2>Check the sequence, not just each image</h2>
        <p>
          Profile grids and scrolling feeds answer different planning questions.
          A grid exposes rows, diagonals, and repeated colors at a glance. A
          vertical feed makes the rhythm between individual posts easier to
          judge. Both views keep your media private while showing the order your
          audience will actually experience.
        </p>
        <p>
          Start with sample content if you are exploring. For a real campaign,
          add the next several assets together, reorder them, and select the
          batch you want to create. Files remain local throughout planning.
        </p>
      </section>

      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="mb-4 font-bold text-2xl tracking-tight">
          Common feed planning questions
        </h2>
        <ToolFaq items={faq} />
      </section>
    </main>
  );
}
