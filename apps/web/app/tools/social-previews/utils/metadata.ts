import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import { getSocialPreviewTool } from "./social-preview-tools";

export function createSocialPreviewMetadata(slug: string): Metadata {
  const content = getSocialPreviewTool(slug);
  if (!content) {
    return {};
  }

  const canonicalPath = `/tools/social-previews/${content.slug}`;
  return createMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    keywords: content.keywords,
    image: getWebUrl(
      `/api/og?title=${encodeURIComponent(content.title)}&description=${encodeURIComponent(content.description)}`
    ),
    alternates: {
      canonical: getWebUrl(canonicalPath),
    },
    openGraph: {
      url: getWebUrl(canonicalPath),
    },
  });
}
