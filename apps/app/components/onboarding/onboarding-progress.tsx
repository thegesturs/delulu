import { cn } from "@delulu/design-system/lib/utils";

interface OnboardingProgressProps {
  currentStep: "goal" | "connect" | "ready" | "plan";
  authoritativeStep?: "goal" | "connect" | "ready" | "plan";
}

const steps = [
  { id: "goal", label: "Goal" },
  { id: "connect", label: "Connect" },
  { id: "ready", label: "Ready" },
  { id: "plan", label: "Plan" },
] as const;

export function OnboardingProgress({
  currentStep,
  authoritativeStep = currentStep,
}: OnboardingProgressProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  const authoritativeIndex = steps.findIndex(
    (step) => step.id === authoritativeStep
  );
  return (
    <ol
      aria-label="Onboarding progress"
      className="grid grid-cols-4 border-zinc-950/10 border-y-[1.5px] border-dotted dark:border-white/10"
    >
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < authoritativeIndex;

        return (
          <li
            aria-current={isActive ? "step" : undefined}
            className={cn(
              "min-w-0 px-2 py-3 sm:px-4",
              index > 0 &&
                "border-zinc-950/10 border-l-[1.5px] border-dotted dark:border-white/10",
              isActive && "bg-muted/45"
            )}
            key={step.id}
          >
            <span
              className={cn(
                "block truncate text-center text-xs sm:text-left",
                isActive
                  ? "font-medium text-foreground"
                  : isCompleted
                    ? "text-foreground/60"
                    : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
