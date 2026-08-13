"use client";

import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@delulu/design-system/components/ui/card";
import { Input } from "@delulu/design-system/components/ui/input";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApiClient } from "@/components/providers/api-client";
import { useWorkspace } from "@/components/providers/workspace";
import { useMutationAtom, useResourceAtom } from "@/state/resources";

const statusVariant = (status?: string) => {
  if (status === "active") {
    return "green" as const;
  }
  if (status === "failed") {
    return "red" as const;
  }
  return "blue" as const;
};

export function WhatsappConnection() {
  const { resources } = useApiClient();
  const { workspaceId } = useWorkspace();
  const id = workspaceId ?? "";
  const connection = useResourceAtom({
    ...resources.agent.whatsapp(id),
    enabled: Boolean(workspaceId),
    staleTime: 2000,
  });
  const start = useMutationAtom(resources.agent.startWhatsapp(id));
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (connection.data?.status !== "onboarding") {
      return;
    }
    const timer = window.setInterval(() => {
      connection.refetch().catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [connection.data?.status, connection.refetch]);

  const beginOnboarding = async () => {
    const popup = window.open("about:blank", "_blank");
    try {
      const result = await start.mutateAsync({ allowedSender: phone.trim() });
      await connection.refetch();
      if (!result.onboardingUrl) {
        popup?.close();
        toast.success("WhatsApp is connected");
        return;
      }
      if (popup) {
        popup.opener = null;
        popup.location.href = result.onboardingUrl;
      } else {
        window.location.href = result.onboardingUrl;
      }
    } catch (error) {
      popup?.close();
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not start WhatsApp setup"
      );
    }
  };

  const current = connection.data;
  return (
    <Card>
      <CardHeader className="gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Message your agent on WhatsApp</CardTitle>
          <CardDescription className="mt-1 max-w-2xl leading-relaxed">
            Connect a business number, then send requests from your approved
            phone. Messages run in this workspace and replies return to the same
            conversation.
          </CardDescription>
        </div>
        {current ? (
          <Badge size="sm" variant={statusVariant(current.status)}>
            {current.status}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {current?.status === "active" ? (
          <div className="space-y-2 text-sm">
            <p>
              Connected as{" "}
              <span className="font-medium">{current.address}</span>. Only
              messages from {current.allowedSender} can control this agent.
            </p>
            <p className="text-muted-foreground">
              Publishing, scheduling and other external actions return a
              single-use approval code before anything changes.
            </p>
          </div>
        ) : (
          <div className="flex max-w-xl flex-col gap-3 sm:flex-row">
            <Input
              aria-label="Approved WhatsApp phone number"
              autoComplete="tel"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+14155550123"
              type="tel"
              value={phone}
            />
            <Button
              className="min-h-11 shrink-0"
              disabled={start.isPending || !phone.trim()}
              onClick={beginOnboarding}
            >
              {start.isPending
                ? "Preparing setup…"
                : current?.status === "onboarding"
                  ? "Continue setup"
                  : "Connect WhatsApp"}
            </Button>
          </div>
        )}
        {current?.status === "onboarding" ? (
          <p className="text-muted-foreground text-sm">
            Complete the provider window. This page will update automatically.
          </p>
        ) : null}
        {current?.status === "failed" && current.failureReason ? (
          <p className="text-destructive text-sm">{current.failureReason}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
