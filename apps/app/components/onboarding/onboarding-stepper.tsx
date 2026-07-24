"use client";

import { useClerk } from "@delulu/auth";
import { Logo } from "@delulu/design-system/components/logo";
import { Button } from "@delulu/design-system/components/ui/button";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Loading03Icon,
} from "@delulu/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useApiClient } from "@/components/providers/api-client";
import { useWorkspace } from "@/components/providers/workspace";
import { useMutationAtom, useResourceAtom } from "@/state/resources";
import {
  ConnectAccountsStep,
  type ConnectionCallbackState,
} from "./connect-accounts-step";
import { GoalStep, type OnboardingGoal } from "./goal-step";
import { OnboardingProgress } from "./onboarding-progress";
import { ReadyStep } from "./ready-step";

type Step = "goal" | "connect" | "ready";

const callbackErrorMessage = (error: string): string => {
  if (error === "user_denied" || error === "user_cancelled") {
    return "The connection was cancelled. Nothing was changed.";
  }
  if (error === "transfer_required") {
    return "This account is connected to another workspace. Return to account settings to transfer it.";
  }
  if (error === "invalid_state") {
    return "This connection attempt expired. Start again to continue safely.";
  }
  return "The provider could not finish connecting. Try again.";
};

export function OnboardingStepper({
  legacyGoal,
}: {
  legacyGoal?: OnboardingGoal;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signOut } = useClerk();
  const { workspaceId } = useWorkspace();
  const { resources } = useApiClient();
  const setup = useResourceAtom({
    ...resources.me.setup(workspaceId ?? ""),
    enabled: Boolean(workspaceId),
    staleTime: 0,
    retry: 2,
  });
  const accounts = useResourceAtom({
    ...resources.connections.list(workspaceId ?? "", { limit: 100 }),
    enabled: Boolean(workspaceId),
    staleTime: 0,
    retry: 2,
  });
  const updateSetup = useMutationAtom(
    resources.me.updateSetup(workspaceId ?? "")
  );
  const completeSetup = useMutationAtom(
    resources.me.completeSetup(workspaceId ?? "")
  );

  const serverGoal = setup.data?.goal ?? null;
  const [selectedGoal, setSelectedGoal] = useState<OnboardingGoal | null>(
    serverGoal ?? legacyGoal ?? null
  );
  const [stepOverride, setStepOverride] = useState<Step | null>(
    searchParams.get("step") === "connect" || legacyGoal ? "connect" : null
  );
  const [callback, setCallback] = useState<ConnectionCallbackState | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const legacyMigrated = useRef(false);
  const contentRef = useRef<HTMLElement>(null);
  const values = accounts.data?.data ?? [];

  useEffect(() => {
    if (serverGoal) {
      setSelectedGoal(serverGoal);
    }
  }, [serverGoal]);

  useEffect(() => {
    if (legacyMigrated.current || serverGoal || !legacyGoal || !workspaceId) {
      return;
    }
    legacyMigrated.current = true;
    updateSetup
      .mutateAsync({ goal: legacyGoal })
      .then(() => setup.refetch())
      .catch(() => {
        legacyMigrated.current = false;
        setStepOverride("goal");
      });
  }, [legacyGoal, serverGoal, setup, updateSetup, workspaceId]);

  const derivedStep: Step =
    setup.data?.webStep === "connect" || setup.data?.webStep === "ready"
      ? setup.data.webStep
      : "goal";
  const step = stepOverride ?? derivedStep;
  const goal = step === "goal" ? selectedGoal : (serverGoal ?? selectedGoal);
  const requirementMet = setup.data?.webStep === "ready";

  const refreshSetup = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const [latestAccounts] = await Promise.all([
        accounts.refetch(),
        setup.refetch(),
      ]);
      return latestAccounts.data?.data ?? [];
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      setRefreshError(message);
      toast.error("Could not refresh setup", {
        description: message,
      });
      return null;
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const notification = searchParams.get("notification");
    if (!(success || error || notification)) {
      return;
    }
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const username = fragment.get("username");
    const provider =
      searchParams.get("provider") ?? searchParams.get("platform");
    if (success === "true") {
      setCallback({ kind: "success", provider, username });
    } else if (
      notification === "transfer_required" ||
      notification === "account_transferred"
    ) {
      setCallback({
        kind: "transfer_required",
        provider,
        username,
        message: callbackErrorMessage("transfer_required"),
        connectionId: searchParams.get("connectionId") ?? undefined,
        sourceWorkspaceId: searchParams.get("sourceWorkspaceId") ?? undefined,
      });
    } else if (error) {
      setCallback({
        kind: "error",
        provider,
        username,
        message: callbackErrorMessage(error),
      });
    }
    setStepOverride("connect");
    const syncCallback = async () => {
      const attempts = success === "true" ? 3 : 1;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        if (attempt > 0) {
          await new Promise((resolve) =>
            window.setTimeout(resolve, 500 * 2 ** attempt)
          );
        }
        const latestAccounts = await refreshSetup();
        if (!latestAccounts || success !== "true") {
          return;
        }
        const expectedPlatform = provider?.toUpperCase();
        if (
          latestAccounts.some(
            (account) =>
              !expectedPlatform || account.platform === expectedPlatform
          )
        ) {
          return;
        }
      }
      setRefreshError(
        "The provider accepted the connection, but the account has not appeared yet. Refresh again or restart the connection."
      );
    };
    syncCallback().catch(() => undefined);
    window.history.replaceState(window.history.state, "", "/onboarding");
    window.requestAnimationFrame(() => contentRef.current?.focus());
    // Callback parameters are consumed once on the full-page return.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const qualifyingAccount = useMemo(() => {
    if (goal === "auto_dm") {
      return values.find((account) => account.platform === "INSTAGRAM");
    }
    return values[0];
  }, [goal, values]);

  const persistGoal = async (nextGoal: OnboardingGoal): Promise<boolean> => {
    try {
      await updateSetup.mutateAsync({ goal: nextGoal });
      await setup.refetch();
      return true;
    } catch (error) {
      toast.error("Could not save your choice", {
        description: error instanceof Error ? error.message : undefined,
      });
      return false;
    }
  };

  const selectGoal = (nextGoal: OnboardingGoal) => {
    setSelectedGoal(nextGoal);
    persistGoal(nextGoal).catch(() => undefined);
  };

  const saveGoal = async () => {
    if (!(selectedGoal && workspaceId)) {
      return;
    }
    if (serverGoal === selectedGoal || (await persistGoal(selectedGoal))) {
      setStepOverride("connect");
    }
  };

  const completeAndNavigate = async (destination: string) => {
    if (!workspaceId) {
      return;
    }
    try {
      await completeSetup.mutateAsync(undefined);
      router.push(destination);
      router.refresh();
    } catch (error) {
      toast.error("Could not finish setup", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ redirectUrl: "/sign-in" });
    } catch (error) {
      setIsSigningOut(false);
      toast.error("Could not log out", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const isBusy =
    updateSetup.isPending ||
    completeSetup.isPending ||
    isRefreshing ||
    isSigningOut;
  const primaryLabel =
    step === "goal"
      ? "Continue"
      : step === "connect"
        ? requirementMet
          ? "Continue"
          : goal === "auto_dm"
            ? "Connect Instagram to continue"
            : "Connect an account to continue"
        : goal === "auto_dm"
          ? "Create your first auto-DM"
          : "Create your first post";

  const context = {
    goal: {
      eyebrow: "A focused start",
      title: "Set up around the outcome you want.",
      description:
        "Three short steps, no payment wall. Your choice only changes the recommended starting point.",
    },
    connect: {
      eyebrow: "Official connections",
      title: "Your credentials stay with the platform.",
      description:
        "OAuth sends you to the provider and returns directly here. You can replace or add accounts later.",
    },
    ready: {
      eyebrow: "Ready to go",
      title: "The setup is done. The real work starts now.",
      description:
        "Open the guided workflow or head to your dashboard. Pricing only appears when a paid capability is needed.",
    },
  }[step];

  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b pb-5">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-muted-foreground text-sm">
              Step {step === "goal" ? 1 : step === "connect" ? 2 : 3} of 3
            </span>
            <Button
              className="min-h-11 px-3 sm:px-4"
              disabled={isBusy}
              onClick={handleSignOut}
              variant="ghost"
            >
              {isSigningOut ? (
                <Icon
                  className="animate-spin motion-reduce:animate-none"
                  icon={Loading03Icon}
                  size={16}
                />
              ) : null}
              Log out
            </Button>
          </div>
        </header>

        <div className="py-6">
          <OnboardingProgress currentStep={step} />
        </div>

        <div className="grid flex-1 gap-8 pb-48 sm:pb-32 lg:grid-cols-[0.75fr_1.25fr] lg:items-start lg:gap-14 lg:pt-8 lg:pb-10">
          <aside className="space-y-3 lg:sticky lg:top-8">
            <p className="font-medium text-primary text-sm">
              {context.eyebrow}
            </p>
            <h2 className="max-w-md font-semibold text-2xl tracking-tight">
              {context.title}
            </h2>
            <p className="max-w-md text-muted-foreground leading-relaxed">
              {context.description}
            </p>
          </aside>

          <section
            aria-busy={isSigningOut}
            aria-label="Onboarding step"
            className="rounded-2xl border bg-background p-5 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-8"
            inert={isSigningOut}
            ref={contentRef}
            tabIndex={-1}
          >
            {step === "goal" ? (
              <GoalStep
                onSelect={selectGoal}
                pending={updateSetup.isPending}
                selected={selectedGoal}
              />
            ) : null}
            {step === "connect" && goal ? (
              <ConnectAccountsStep
                accounts={values}
                callback={callback}
                goal={goal}
                isRefreshing={isRefreshing}
                onRefresh={refreshSetup}
                refreshError={refreshError}
                requirementMet={requirementMet}
              />
            ) : null}
            {step === "ready" && goal && qualifyingAccount ? (
              <ReadyStep account={qualifyingAccount} goal={goal} />
            ) : null}
          </section>
        </div>

        <footer className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:static lg:border-t lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
          <div className="mx-auto flex w-full max-w-6xl flex-col-reverse items-stretch justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              {step === "goal" ? null : (
                <Button
                  className="min-h-11 w-full sm:w-auto"
                  disabled={isBusy}
                  onClick={() =>
                    setStepOverride(step === "ready" ? "connect" : "goal")
                  }
                  variant="ghost"
                >
                  <Icon icon={ArrowLeft01Icon} size={16} />
                  Back
                </Button>
              )}
            </div>

            <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center">
              {step === "ready" ? (
                <Button
                  className="min-h-11 w-full sm:w-auto"
                  disabled={isBusy}
                  onClick={() => completeAndNavigate("/")}
                  variant="ghost"
                >
                  Go to dashboard
                </Button>
              ) : null}
              <Button
                className="min-h-11 w-full sm:w-auto sm:min-w-44"
                disabled={
                  isBusy ||
                  (step === "goal" && !selectedGoal) ||
                  (step === "connect" && !requirementMet)
                }
                onClick={async () => {
                  if (step === "goal") {
                    await saveGoal();
                    return;
                  }
                  if (step === "connect") {
                    setCallback(null);
                    setStepOverride("ready");
                    return;
                  }
                  await completeAndNavigate(
                    goal === "auto_dm"
                      ? "/automations/new?template=lead-magnet"
                      : "/post"
                  );
                }}
              >
                {isBusy ? (
                  <Icon
                    className="animate-spin motion-reduce:animate-none"
                    icon={Loading03Icon}
                    size={16}
                  />
                ) : null}
                {primaryLabel}
                {isBusy ? null : <Icon icon={ArrowRight01Icon} size={16} />}
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
