"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { cn } from "@delulu/design-system/lib/utils";
import { Icon } from "@delulu/design-system/providers/icon";
import { Comment01Icon, PencilEdit01Icon, Tick02Icon } from "@delulu/icons";

export type OnboardingGoal = "publish" | "auto_dm";

const goals = [
  {
    value: "publish" as const,
    title: "Publish content",
    description: "Create once and publish across your social accounts.",
    icon: PencilEdit01Icon,
  },
  {
    value: "auto_dm" as const,
    title: "Automate Instagram DMs",
    description: "Turn comments and keywords into automatic conversations.",
    icon: Comment01Icon,
  },
];

export function GoalStep({
  selected,
  pending,
  onSelect,
}: {
  selected: OnboardingGoal | null;
  pending: boolean;
  onSelect: (goal: OnboardingGoal) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="font-medium text-primary text-sm">
          Choose your first win
        </p>
        <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
          What do you want to do first?
        </h1>
        <p className="max-w-xl text-base text-muted-foreground leading-relaxed">
          We&apos;ll tailor setup around this choice. You can use every feature
          later.
        </p>
      </div>

      <div aria-label="Setup goal" className="space-y-3" role="radiogroup">
        {goals.map((goal) => {
          const isSelected = selected === goal.value;
          return (
            <Button
              aria-checked={isSelected}
              className={cn(
                "h-auto min-h-20 w-full justify-start gap-4 whitespace-normal px-4 py-4 text-left",
                isSelected && "border-primary bg-primary/5"
              )}
              disabled={pending}
              key={goal.value}
              onClick={() => onSelect(goal.value)}
              role="radio"
              variant="outline"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <Icon icon={goal.icon} size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-base">
                  {goal.title}
                </span>
                <span className="mt-1 block text-muted-foreground text-sm">
                  {goal.description}
                </span>
              </span>
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                )}
              >
                {isSelected ? <Icon icon={Tick02Icon} size={14} /> : null}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
