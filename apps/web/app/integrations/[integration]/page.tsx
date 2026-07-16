import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntegrationDetailPage } from "../_components/integration-detail-page";
import {
  getIntegrationPage,
  integrationPages,
} from "../_lib/integration-pages";
import { createIntegrationMetadata } from "../_lib/integration-seo";

interface IntegrationPageProps {
  readonly params: Promise<{ integration: string }>;
}

export const dynamicParams = false;

export const generateStaticParams = () =>
  integrationPages.map((integration) => ({ integration: integration.slug }));

export const generateMetadata = async ({
  params,
}: IntegrationPageProps): Promise<Metadata> => {
  const { integration: slug } = await params;
  const integration = getIntegrationPage(slug);

  if (!integration) {
    return {};
  }

  return createIntegrationMetadata(integration);
};

export default async function IntegrationPage({
  params,
}: IntegrationPageProps) {
  const { integration: slug } = await params;
  const integration = getIntegrationPage(slug);

  if (!integration) {
    notFound();
  }

  return <IntegrationDetailPage integration={integration} />;
}
