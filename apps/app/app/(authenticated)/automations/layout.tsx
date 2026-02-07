"use client";

import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { useFeatureFlag } from "@/hooks/use-feature-flag";

export default function AutomationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { enabled, isLoading } = useFeatureFlag("automations");

  if (isLoading) {
    return null;
  }

  if (!enabled) {
    redirect("/");
  }

  return <>{children}</>;
}
