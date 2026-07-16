import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@delulu/design-system/components/ui/card";
import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import {
  type BreadcrumbList,
  type ItemList,
  JsonLd,
  type WithContext,
} from "@delulu/seo/json-ld";
import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { ToolFaq } from "@/components/tools/tool-faq";
import { socialPreviewTools } from "./utils/social-preview-tools";

const canonicalPath = "/tools/social-previews";

export const metadata = createMetadata({
  title: "Free Post & Profile Previews",
  description:
    "Preview social posts and profiles before publishing. Free, responsive, private browser tools for captions, media, identities, grids, and professional updates.",
  alternates: { canonical: getWebUrl(canonicalPath) },
  openGraph: { url: getWebUrl(canonicalPath) },
  image: getWebUrl(
    `/api/og?title=${encodeURIComponent("Post & Profile Previews")}&description=${encodeURIComponent("See your content before you publish")}`
  ),
});

const itemListSchema: WithContext<ItemList> = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Free post and profile previews",
  itemListElement: socialPreviewTools.map((tool, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: tool.title,
    description: tool.description,
    url: getWebUrl(`${canonicalPath}/${tool.slug}`),
  })),
};

const breadcrumbSchema: WithContext<BreadcrumbList> = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Tools",
      item: getWebUrl("/tools"),
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Post Previews",
      item: getWebUrl(canonicalPath),
    },
  ],
};

const faq = [
  {
    question: "Can I preview posts for free?",
    answer:
      "Yes. Every preview here is free to use without signing up, and there is no visible usage limit.",
  },
  {
    question: "Do I need to connect a social account?",
    answer:
      "No. These are anonymous planning tools and never request access to a social account.",
  },
  {
    question: "Are uploaded preview images stored?",
    answer:
      "No. Images are shown through temporary browser URLs and are not uploaded to Delulu while you preview them.",
  },
  {
    question: "Which preview should I start with?",
    answer:
      "Choose the channel where the post will publish. Use the profile preview only when you need to review an Instagram bio, public counts, and a nine-tile grid together.",
  },
  {
    question: "Are these exact copies of social platform interfaces?",
    answer:
      "No. They preserve useful information hierarchy while favoring accessibility, responsiveness, and durable planning over pixel-level imitation.",
  },
  {
    question: "Can I use my own identity and engagement counts?",
    answer:
      "Yes. Each tool exposes the identity and representative count fields that matter for that specific preview.",
  },
  {
    question: "Can a preview become a scheduled post?",
    answer:
      "Post previews include a composer handoff. The text moves privately in the URL fragment, and signed-in users can finish account and scheduling choices in Delulu.",
  },
  {
    question: "Which social channels can I preview?",
    answer:
      "You can preview posts for Instagram, LinkedIn, Facebook, X, Threads, TikTok, and YouTube, plus an Instagram profile and nine-tile grid.",
  },
];

export default function SocialPreviewsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl border-border border-x border-dashed px-4 py-12 sm:py-16">
      <JsonLd code={itemListSchema} />
      <JsonLd code={breadcrumbSchema} />

      <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
        <Link className="hover:text-foreground" href="/tools">
          Tools
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Post Previews</span>
      </nav>

      <div className="mx-auto mt-8 max-w-3xl text-center">
        <div className="mx-auto flex w-fit items-center -space-x-1 rounded-xl border bg-background px-3 py-2 shadow-sm">
          {(["INSTAGRAM", "LINKEDIN", "FACEBOOK", "TIKTOK"] as const).map(
            (platform) => (
              <span
                className="flex size-8 items-center justify-center rounded-full border bg-background"
                key={platform}
              >
                <SocialIcon size="md" type={platform} />
              </span>
            )
          )}
        </div>
        <h1 className="mt-5 font-bold text-4xl tracking-tight sm:text-5xl">
          <Balancer>See your post before you publish</Balancer>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground leading-8">
          Preview the full reading experience before you publish. Test post
          copy, media, identity, engagement context, bios, and visual grids in
          private browser tools built for real planning work.
        </p>
      </div>

      <section aria-labelledby="all-preview-tools" className="mt-12">
        <h2 className="font-bold text-2xl" id="all-preview-tools">
          Choose what you want to preview
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {socialPreviewTools.map((tool) => (
            <Link
              className={`block h-full ${tool.kind === "all" ? "md:col-span-3" : ""}`}
              href={`${canonicalPath}/${tool.slug}`}
              key={tool.slug}
            >
              <Card className="group h-full transition-colors hover:border-primary/60">
                <CardHeader>
                  <span
                    className={`mb-2 flex h-10 items-center justify-center rounded-lg bg-muted ${tool.kind === "all" ? "w-20" : "w-10"}`}
                  >
                    {tool.kind === "all" ? (
                      <span className="flex -space-x-1.5">
                        {tool.platforms?.slice(0, 3).map((platform) => (
                          <span
                            className="flex size-6 items-center justify-center rounded-full border bg-background"
                            key={platform}
                          >
                            <SocialIcon size="xs" type={platform} />
                          </span>
                        ))}
                      </span>
                    ) : (
                      <SocialIcon size="md" type={tool.platform} />
                    )}
                  </span>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {tool.title}
                    <ArrowRight
                      aria-hidden
                      className="size-4 opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-6">
                    {tool.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="font-bold text-2xl">Choose by planning job</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl border p-5">
            <Sparkles aria-hidden className="size-5 text-primary" />
            <h3 className="mt-3 font-semibold">Post-level review</h3>
            <p className="mt-2 text-muted-foreground text-sm leading-6">
              Check the opening, line breaks, image crop, identity context,
              date, and representative engagement before moving copy into the
              composer.
            </p>
          </div>
          <div className="rounded-xl border p-5">
            <ShieldCheck aria-hidden className="size-5 text-primary" />
            <h3 className="mt-3 font-semibold">Profile-level review</h3>
            <p className="mt-2 text-muted-foreground text-sm leading-6">
              Review a bio and nine-tile grid as one composition without
              uploading private planning assets to a server.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="font-bold text-2xl">How private previews work</h2>
        <p className="mt-4 text-muted-foreground leading-7">
          Text stays in local React state, while selected images use temporary
          object URLs generated by your browser. Post-copy handoffs use a URL
          fragment, which browsers do not include in the request sent to the
          destination server. The authenticated composer consumes the fragment
          once and removes it from the address bar.
        </p>
      </section>

      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="font-bold text-2xl">Social preview questions</h2>
        <div className="mt-4">
          <ToolFaq items={faq} />
        </div>
      </section>
    </main>
  );
}
