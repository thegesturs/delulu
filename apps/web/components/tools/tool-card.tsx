import {
  Card,
  CardContent,
  CardHeader,
} from "@delulu/design-system/components/ui/card";
import {
  ArrowRight,
  CalendarDays,
  type LucideIcon,
  Scissors,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { CATEGORY_LABELS, getToolPath, type Tool } from "@/lib/tools";

// String keys in the tools registry map to icons here so the registry stays
// server-safe and free of React imports.
const ICONS: Record<string, LucideIcon> = {
  scissors: Scissors,
  calendar: CalendarDays,
};

export function ToolIcon({ name }: { name: string }) {
  const Icon = ICONS[name] ?? Wrench;
  return <Icon className="size-5" />;
}

export function ToolCard({ tool }: { tool: Tool }) {
  const comingSoon = tool.status === "coming-soon";

  const inner = (
    <Card className="group h-full transition-colors hover:border-primary/60">
      <CardHeader className="flex flex-row items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ToolIcon name={tool.icon} />
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
            <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
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
    <Link className="block" href={getToolPath(tool)}>
      {inner}
    </Link>
  );
}
