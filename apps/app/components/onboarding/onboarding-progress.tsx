import { cn } from "@delulu/design-system/lib/utils";
import { Icon } from "@delulu/design-system/providers/icon";
import { Tick02Icon } from "@delulu/icons";

interface OnboardingProgressProps {
  currentStep: "goal" | "connect" | "ready";
}

const steps = [
  { id: "goal", label: "Goal" },
  { id: "connect", label: "Connect" },
  { id: "ready", label: "Ready" },
] as const;

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  return (
    <ol aria-label="Onboarding progress" className="flex items-center">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;

        return (
          <li
            aria-current={isActive ? "step" : undefined}
            className="flex flex-1 items-center last:flex-none"
            key={step.id}
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border font-medium text-xs",
                  isCompleted &&
                    "border-primary bg-primary text-primary-foreground",
                  isActive && "border-primary text-primary",
                  !(isActive || isCompleted) &&
                    "border-border text-muted-foreground"
                )}
              >
                {isCompleted ? <Icon icon={Tick02Icon} size={14} /> : index + 1}
              </span>
              <span
                className={cn(
                  "font-medium text-xs sm:text-sm",
                  isActive || isCompleted
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </span>
            {index < steps.length - 1 ? (
              <span
                className={cn(
                  "mx-3 h-px flex-1",
                  isCompleted ? "bg-primary" : "bg-border"
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
