import { BlogLayout } from '@/components/blog/blog-layout';
import CTA from '@/components/cta';
import { components } from '@/components/mdx-components';
import { allLegals } from 'content-collections';
import { notFound } from 'next/navigation';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import { MdastToJsx } from 'safe-mdx';

const parser = remark()
  .use(remarkMdx)
  .use(remarkGfm)
  .use(() => {
    return (tree, file) => {
      file.data.ast = tree;
    };
  });

type PageProps = {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const legal = allLegals.find((legal) => legal.slug === slug);

  if (!legal) {
    notFound();
  }

  const legalWithType = {
    ...legal,
    type: 'legal' as const,
  };

  // Parse and render MDX safely
  const file = parser.processSync(legal.content);
  const mdast = file.data.ast;
  const visitor = new MdastToJsx({ code: legal.content, mdast, components });
  const content = visitor.run();

  return (
    <div>
      <BlogLayout blog={legalWithType}>{content}</BlogLayout>
      <div className="mt-12">
        <CTA />
      </div>
    </div>
  );
}
