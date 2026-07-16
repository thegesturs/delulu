import { createArticleSchema, JsonLd } from "@delulu/seo/json-ld";
import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import { allLegals } from "content-collections";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import { MdastToJsx } from "safe-mdx";
import { BlogLayout } from "@/components/blog/blog-layout";
import CTA from "@/components/home/cta";
import { components } from "@/components/home/mdx-components";

const parser = remark()
  .use(remarkMdx)
  .use(remarkGfm)
  .use(() => {
    return (tree, file) => {
      file.data.ast = tree;
    };
  });

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { slug } = await params;
  const legal = allLegals.find((legal) => legal.slug === slug);

  if (!legal) {
    return notFound();
  }

  const canonicalUrl = getWebUrl(`/legal/${slug}`);

  return createMetadata({
    title: legal.title,
    description: `${legal.title} - Delulu Social legal documentation`,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  });
};

interface PageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const legal = allLegals.find((legal) => legal.slug === slug);

  if (!legal) {
    notFound();
  }

  const legalWithType = {
    ...legal,
    type: "legal" as const,
  };

  const pageUrl = getWebUrl(`/legal/${slug}`);
  const currentDate = new Date().toISOString();

  const articleSchema = createArticleSchema({
    title: legal.title,
    description: `${legal.title} - Delulu Social legal documentation`,
    url: pageUrl,
    datePublished: legal.date || currentDate,
    dateModified: legal.date || currentDate,
  });

  // Parse and render MDX safely
  const file = parser.processSync(legal.content);
  const mdast = file.data.ast;
  const visitor = new MdastToJsx({ code: legal.content, mdast, components });
  const content = visitor.run();

  return (
    <div>
      <JsonLd code={articleSchema} />
      <BlogLayout blog={legalWithType}>{content}</BlogLayout>
      <div className="mt-12">
        <CTA />
      </div>
    </div>
  );
}
