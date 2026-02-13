"use client";

import { Badge } from "@delulu/design-system/components/ui/badge";
import { cn } from "@delulu/design-system/lib/utils";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  Comment01Icon,
  MailSend01Icon,
  TickDouble01Icon,
  UserStoryIcon,
} from "@hugeicons-pro/core-solid-rounded";
import Link from "next/link";
import { AUTOMATION_TEMPLATES } from "./flow-builder/templates/automation-templates";

const TEMPLATE_ICONS: Record<string, typeof Comment01Icon> = {
  "grow-followers-comments": TickDouble01Icon,
  "grow-followers-stories": TickDouble01Icon,
  "email-collection": MailSend01Icon,
  "lead-magnet": Comment01Icon,
  "story-engagement": UserStoryIcon,
};

const TEMPLATE_GRADIENTS: Record<string, string> = {
  "grow-followers-comments": "from-purple-500 to-pink-500",
  "grow-followers-stories": "from-pink-500 to-rose-500",
  "email-collection": "from-blue-500 to-cyan-500",
  "lead-magnet": "from-amber-500 to-orange-500",
  "story-engagement": "from-green-500 to-emerald-500",
};

export function AutomationQuickAccess() {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-medium text-sm">Automations</h3>
      <div className="grid grid-cols-1 gap-1.5">
        {AUTOMATION_TEMPLATES.map((template) => {
          const TemplateIcon =
            TEMPLATE_ICONS[template.slug] || Comment01Icon;
          const gradient =
            TEMPLATE_GRADIENTS[template.slug] || "from-purple-500 to-pink-500";

          return (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-lg border p-2.5 text-left transition-all",
                "border-border hover:border-primary/40 hover:bg-muted/50"
              )}
              href={`/automations/new?template=${template.slug}`}
              key={template.slug}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
                  gradient
                )}
              >
                <Icon className="text-white" icon={TemplateIcon} size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-xs">{template.name}</p>
                  <Badge className="text-[9px] px-1 py-0" variant="secondary">
                    {template.stepCount}
                  </Badge>
                </div>
                <p className="line-clamp-1 text-muted-foreground text-[11px]">
                  {template.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
