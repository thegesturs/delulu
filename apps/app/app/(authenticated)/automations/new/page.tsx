import { FlowBuilder } from "@/components/automations/flow-builder/flow-builder";

export default async function NewAutomationPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;
  return <FlowBuilder templateSlug={template} />;
}
