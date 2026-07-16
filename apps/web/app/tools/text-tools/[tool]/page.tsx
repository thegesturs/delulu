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
  });
};

export default async function TextToolPage({ params }: TextToolPageProps) {
  const { tool: slug } = await params;
  const textTool = getTextTool(slug);
  const registryTool = getTool(slug);
  if (!(textTool && registryTool)) {
    notFound();
  }

  const isCounter = textTool.mode === "count";
  const howToSteps = isCounter
    ? [
        {
          name: "Add your draft",
          text:
            "Paste your text or start writing in the " +
            textTool.title.toLowerCase() +
            ". The draft stays in your browser.",
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
          name: "Copy the finished text",
          text: textTool.composerHandoff
            ? "Copy the draft, or use Create post in Delulu to copy it and open a new post ready for pasting."
            : "Copy the finished text and paste it into the destination editor.",
        },
      ]
    : [
        {
          name: "Enter plain text",
          text:
            "Type or paste text into the " + textTool.title.toLowerCase() + ".",
        },
        {
          name: "Check the generated result",
          text: "The copy-ready result updates instantly while all processing stays on your device.",
        },
        {
          name: "Copy and preview",
          text: "Copy the result, paste it into the destination editor, and preview it before publishing.",
        },
      ];

  const sections = [
    {
      heading: "A practical " + textTool.title.toLowerCase() + " example",
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
      heading: "Tips for using this " + (isCounter ? "counter" : "generator"),
      body: (
        <ul>
          {textTool.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      ),
    },
    {
      heading: "Private, browser-based text processing",
      body: (
        <p>
          Your draft is analyzed and transformed in this browser tab. It is not
          uploaded or saved by the tool. Characters are counted as Unicode code
          points, so an emoji counts as one character here; a destination
          platform may still apply its own final validation.{" "}
          {textTool.limitSource ? (
            <>
              The working limit is based on the current{" "}
              <a href={textTool.limitSource}>platform documentation</a>.
            </>
          ) : null}
        </p>
      ),
    },
  ];

  return (
    <ToolPageLayout
      faq={textTool.faq}
      howToHeading={"How to use the " + textTool.title}
      howToSteps={howToSteps}
      sections={sections}
      seo={<p>{textTool.intro}</p>}
      tool={registryTool}
    >
      <TextTool tool={textTool} />
    </ToolPageLayout>
  );
}
