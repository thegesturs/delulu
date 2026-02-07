"use client";

import { useParams } from "next/navigation";
import { FlowBuilder } from "@/components/automations/flow-builder/flow-builder";

export default function EditAutomationPage() {
  const params = useParams();
  const automationId = params.id as string;

  return <FlowBuilder automationId={automationId} />;
}
