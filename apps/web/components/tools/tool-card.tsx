import {
  Card,
  CardContent,
  CardHeader,
} from "@delulu/design-system/components/ui/card";
import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import type { SupportedSocialPlatform } from "@delulu/design-system/lib/social-config";
import {
  ArrowRight,
  CalendarDays,
  Hash,
  type LucideIcon,
  Pilcrow,
  Scissors,
  Type,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { CATEGORY_LABELS, getToolHref, type Tool } from "@/lib/tools";

const ICONS: Record<string, LucideIcon> = {
  calendar: CalendarDays,
  hash: Hash,
  pilcrow: Pilcrow,
  scissors: Scissors,
  type: Type,
};

const SOCIAL_ICONS: Record<string, SupportedSocialPlatform> = {
  facebook: "FACEBOOK",
  instagram: "INSTAGRAM",
  linkedin: "LINKEDIN",
  tiktok: "TIKTOK",
  youtube: "YOUTUBE",
};

export function ToolIcon({ name }: { name: string }) {
  const Icon = ICONS[name] ?? Wrench;
  return <Icon aria-hidden className="size-5 text-primary" />;
}

export function ToolCard({ tool }: { tool: Tool }) {
  const socialIcon = SOCIAL_ICONS[tool.icon];
  const comingSoon = tool.status === "coming-soon";

  const inner = (
    <Card className="group h-full transition-colors hover:border-primary/60">
      <CardHeader className="flex flex-row items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
          {socialIcon ? (
            <SocialIcon size="md" type={socialIcon} />
          ) : (
            <ToolIcon name={tool.icon} />
          )}
        </span>
        <span className="text-muted-foreground text-xs uppercase tracking-wide">
          {CATEGORY_LABELS[tool.category]}
        </span>
      </CardHeader>
      <CardContent>
        <h3 className="flex items-center gap-1.5 font-semibold text-foreground text-lg">
          {tool.title}
          {comingSoon ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground uppercase">
              Soon
            </span>
          ) : (
            <ArrowRight
              aria-hidden
              className="size-4 opacity-0 transition-opacity group-hover:opacity-100"
            />
          )}
        </h3>
        <p className="mt-2 text-muted-foreground text-sm leading-6">
          {tool.description}
        </p>
      </CardContent>
    </Card>
  );

  if (comingSoon) {
    return <div className="cursor-default opacity-70">{inner}</div>;
  }

  return (
    <Link className="block h-full" href={getToolHref(tool)}>
      {inner}
    </Link>
  );
}
