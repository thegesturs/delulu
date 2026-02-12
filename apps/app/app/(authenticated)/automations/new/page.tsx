"use client";

import { useSearchParams } from "next/navigation";
import { FlowBuilder } from "@/components/automations/flow-builder/flow-builder";

export default function NewAutomationPage() {
  const searchParams = useSearchParams();
  const templateSlug = searchParams.get("template") || undefined;

  return <FlowBuilder templateSlug={templateSlug} />;
}
