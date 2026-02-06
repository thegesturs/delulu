'use client';

import { FlowBuilder } from '@/components/automations/flow-builder/flow-builder';
import { useParams } from 'next/navigation';

export default function EditAutomationPage() {
  const params = useParams();
  const automationId = params.id as string;

  return <FlowBuilder automationId={automationId} />;
}
