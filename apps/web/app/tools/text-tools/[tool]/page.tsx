import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { getTool } from "@/lib/tools";
import { TextTool } from "../utils/text-tool";
import {
  getTextTool,
  getTextToolMetadata,
  getTextToolUiCopy,
  textToolSlugs,
} from "../utils/text-tools";

interface TextToolPageProps {
  params: Promise<{ tool: string }>;
}

export const generateStaticParams = () =>
  textToolSlugs.map((tool) => ({ tool }));

export const generateMetadata = async ({
  params,
}: TextToolPageProps): Promise<Metadata> => {
  const { tool: slug } = await params;
  const textTool = getTextTool(slug);
  if (!textTool) {
    return {};
  }
  const metadata = getTextToolMetadata(slug);
  return createMetadata({
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    image: getWebUrl(
      "/api/og?title=" +
        encodeURIComponent(textTool.title) +
        "&description=" +
        encodeURIComponent(textTool.description)
    ),
    alternates: { canonical: getWebUrl(metadata.canonicalPath) },
    openGraph: { url: getWebUrl(metadata.canonicalPath) },
  });
};

export default async function TextToolPage({ params }: TextToolPageProps) {
  const { tool: slug } = await params;
  const textTool = getTextTool(slug);
  const registryTool = getTool(slug);
  if (!(textTool && registryTool)) {
    notFound();
  }
  const ui = getTextToolUiCopy(slug);

  const isCounter = textTool.mode === "count";
  const howToSteps = isCounter
    ? [
        {
          name: `Write your ${ui.inputLabel.toLowerCase()}`,
          text:
            "Paste or write your " +
            ui.inputLabel.toLowerCase() +
            ". Nothing is uploaded while you work.",
        },
        {
          name: "Review the live counts",
          text: textTool.limit
            ? "Watch characters, words, hashtags, mentions, and the remaining " +
              textTool.limit.toLocaleString("en-US") +
              "-character budget update as you edit."
            : "Watch characters, words, hashtags, mentions, and lines update as you edit.",
        },
        {
          name: ui.copyAction,
          text: textTool.composerHandoff
            ? `Use ${ui.copyAction}, or choose Create this post in Delulu to copy it and open a new post.`
            : `Use ${ui.copyAction}, then paste it into the destination field.`,
        },
      ]
    : [
        {
          name: `Add your ${ui.inputLabel.toLowerCase()}`,
          text: `Type or paste your ${ui.inputLabel.toLowerCase()} above.`,
        },
        {
          name: `Review ${ui.outputLabel?.toLowerCase() ?? "the result"}`,
          text: "The copy-ready text updates as you type. Nothing is uploaded.",
        },
        {
          name: ui.copyAction,
          text: `Choose ${ui.copyAction}, paste it into the destination editor, and preview it before publishing.`,
        },
      ];

  const sections = [
    {
      heading: ui.exampleHeading,
      body: (
        <div>
          <p>
            Try this sample, then replace it with language that fits your
            audience:
          </p>
          <blockquote className="whitespace-pre-wrap">
            {textTool.example}
          </blockquote>
        </div>
      ),
    },
    {
      heading: textTool.composerHandoff
        ? "Before you publish"
        : "Before you paste the result",
      body: (
        <ul>
          {textTool.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      ),
    },
    {
      heading: "Your draft stays private",
      body: (
        <p>
          Your draft stays in this tab while you count or format it. It is not
          uploaded or saved. A typical emoji counts as one character here;
          combined emoji may be counted differently by the app where you
          publish.{" "}
          {textTool.limitSource ? (
            <>
              The working limit follows the{" "}
              <a href={textTool.limitSource}>
                current{" "}
                {textTool.limitLabel?.toLowerCase() ?? "character limit"}
              </a>
              .
            </>
          ) : null}
        </p>
      ),
    },
  ];

  return (
    <ToolPageLayout
      faq={textTool.faq}
      howToHeading={ui.howToHeading}
      howToSteps={howToSteps}
      sections={sections}
      seo={<p>{textTool.intro}</p>}
      tool={registryTool}
    >
      <TextTool tool={textTool} />
    </ToolPageLayout>
  );
}
