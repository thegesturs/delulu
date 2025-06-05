import { BlogLayout } from '@/components/blog/blog-layout';
import CTA from '@/components/cta';
import { components } from '@/components/mdx-components';
import { MDXContent } from '@content-collections/mdx/react';
import { allLegals } from 'content-collections';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const legal = allLegals.find((l) => l.slug === slug);

  console.log(allLegals, 'all legals');
  console.log(slug, 'slug');
  if (!legal) {
    return notFound();
  }

  const legalWithType = {
    ...legal,
    type: 'legal' as const,
  };

  return (
    <div>
      <BlogLayout blog={legalWithType}>
        <MDXContent components={components} code={legal.body} />
      </BlogLayout>
      <div className="py-20">
        <CTA />
      </div>
    </div>
  );
}
