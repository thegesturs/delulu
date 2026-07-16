import type {
  BreadcrumbList,
  SoftwareApplication,
  WebPage,
  WithContext,
} from "@delulu/seo/json-ld";
import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import type { IntegrationPageDefinition } from "./integration-pages";

const integrationImage = (title: string, description: string) =>
  getWebUrl(
    `/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`
  );

const indexTitle = "Social Media Integrations";
const indexDescription =
  "Explore Delulu integrations for publishing, scheduling, video, visual campaigns, professional updates, and community conversations.";

export const createIntegrationsMetadata = (): Metadata => {
  const canonical = getWebUrl("/integrations");
  const image = integrationImage(indexTitle, indexDescription);

  return createMetadata({
    title: indexTitle,
    description: indexDescription,
    image,
    alternates: { canonical },
    openGraph: {
      title: `${indexTitle} | Delulu Social`,
      description: indexDescription,
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: indexTitle,
      description: indexDescription,
    },
    robots: { index: true, follow: true },
  });
};

export const createIntegrationMetadata = (
  integration: IntegrationPageDefinition
): Metadata => {
  const canonical = getWebUrl(`/integrations/${integration.slug}`);
  const image = integrationImage(
    integration.metaTitle,
    integration.metaDescription
  );

  return createMetadata({
    title: integration.metaTitle,
    description: integration.metaDescription,
    image,
    alternates: { canonical },
    openGraph: {
      title: `${integration.metaTitle} | Delulu Social`,
      description: integration.metaDescription,
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: integration.metaTitle,
      description: integration.metaDescription,
    },
    robots: { index: true, follow: true },
  });
};

export const createIntegrationBreadcrumbSchema = (
  integration?: IntegrationPageDefinition
): WithContext<BreadcrumbList> => {
  const items = [
    { name: "Home", url: getWebUrl() },
    { name: "Integrations", url: getWebUrl("/integrations") },
  ];

  if (integration) {
    items.push({
      name: integration.name,
      url: getWebUrl(`/integrations/${integration.slug}`),
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

export const createIntegrationsWebPageSchema = (): WithContext<WebPage> => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: indexTitle,
  description: indexDescription,
  url: getWebUrl("/integrations"),
  isPartOf: {
    "@type": "WebSite",
    name: "Delulu Social",
    url: getWebUrl(),
  },
  inLanguage: "en-US",
});

export const createIntegrationWebPageSchema = (
  integration: IntegrationPageDefinition
): WithContext<WebPage> => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: integration.metaTitle,
  description: integration.metaDescription,
  url: getWebUrl(`/integrations/${integration.slug}`),
  isPartOf: {
    "@type": "WebSite",
    name: "Delulu Social",
    url: getWebUrl(),
  },
  about: {
    "@type": "SoftwareApplication",
    name: `Delulu Social for ${integration.name}`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
  },
  inLanguage: "en-US",
});

export const createIntegrationSoftwareSchema = (
  integration: IntegrationPageDefinition
): WithContext<SoftwareApplication> => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: `Delulu Social for ${integration.name}`,
  description: integration.metaDescription,
  url: getWebUrl(`/integrations/${integration.slug}`),
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  featureList: integration.formats.map((format) => format.title),
  isPartOf: {
    "@type": "SoftwareApplication",
    name: "Delulu Social",
    url: getWebUrl(),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
  },
});
