import { JsonLd } from "@delulu/seo/json-ld";
import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeaturePage } from "../_components/feature-page";
import { featureBySlug, features } from "../features";

interface FeatureRouteProps {
  readonly params: Promise<{ readonly feature: string }>;
}

export function generateStaticParams() {
  return features.map((feature) => ({ feature: feature.slug }));
}

export async function generateMetadata({
  params,
}: FeatureRouteProps): Promise<Metadata> {
  const { feature: slug } = await params;
  const feature = featureBySlug.get(slug);
  if (!feature) {
    return {};
  }

  const url = getWebUrl(`/features/${feature.slug}`);
  return createMetadata({
    title: feature.title,
    description: feature.description,
    image: getWebUrl(
      `/api/og?title=${encodeURIComponent(feature.title)}&description=${encodeURIComponent(feature.summary)}`
    ),
    alternates: { canonical: url },
    openGraph: { type: "website", url },
  });
}

export default async function FeatureRoute({ params }: FeatureRouteProps) {
  const { feature: slug } = await params;
  const feature = featureBySlug.get(slug);
  if (!feature) {
    notFound();
  }

  const url = getWebUrl(`/features/${feature.slug}`);
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: getWebUrl() },
      {
        "@type": "ListItem",
        position: 2,
        name: "Features",
        item: getWebUrl("/features"),
      },
      { "@type": "ListItem", position: 3, name: feature.title, item: url },
    ],
  } as const;
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `Delulu Social — ${feature.title}`,
    description: feature.description,
    url,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
    featureList: feature.capabilities,
  } as const;

  return (
    <>
      <JsonLd code={breadcrumbSchema} />
      <JsonLd code={applicationSchema} />
      <FeaturePage feature={feature} />
    </>
  );
}
