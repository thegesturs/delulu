import { notFound } from "next/navigation";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { getTool } from "@/lib/tools";
import { SocialPreviewTool } from "./social-preview-tool";
import { getSocialPreviewTool } from "./social-preview-tools";

export function SocialPreviewPage({ slug }: { slug: string }) {
  const content = getSocialPreviewTool(slug);
  const tool = getTool(`social-previews/${slug}`);

  if (!(content && tool)) {
    notFound();
  }

  return (
    <ToolPageLayout
      faq={content.faq}
      howToHeading={content.howToHeading}
      howToSteps={content.howToSteps}
      sections={content.sections.map((section) => ({
        heading: section.heading,
        body: section.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        )),
      }))}
      seo={content.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      tool={tool}
    >
      <SocialPreviewTool
        example={content.examples[0]}
        kind={content.kind}
        platform={content.platform}
      />
    </ToolPageLayout>
  );
}
