import { AutomationAnalytics } from "@/components/automations/automation-analytics";

export default async function AutomationAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AutomationAnalytics automationId={id} />;
}
