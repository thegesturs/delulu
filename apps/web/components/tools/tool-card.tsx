import {
  Card,
  CardContent,
  CardHeader,
} from "@delulu/design-system/components/ui/card";
import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import { ArrowRight, Wrench } from "lucide-react";
import Link from "next/link";
import { CATEGORY_LABELS, type ToolCardItem } from "@/lib/tools";

export function ToolCard({ item }: { item: ToolCardItem }) {
  const comingSoon = item.status === "coming-soon";
  const platforms = item.socialPlatforms ?? [];

  return (
    <Card className="h-full transition-colors hover:border-primary/60">
      <CardHeader className="flex flex-row items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 min-w-10 items-center justify-center gap-1 rounded-lg bg-muted px-2"
        >
          {platforms.length > 0 ? (
            platforms.map((platform) => (
              <SocialIcon
                key={platform}
                size={platforms.length === 1 ? "md" : "sm"}
                type={platform}
              />
            ))
          ) : (
            <Wrench className="size-5 text-muted-foreground" />
          )}
        </span>
        <span className="text-muted-foreground text-xs uppercase tracking-wide">
          {CATEGORY_LABELS[item.category]}
        </span>
      </CardHeader>
      <CardContent>
        <h3 className="flex items-center gap-1.5 font-semibold text-foreground text-lg">
          {item.title}
          {comingSoon ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground uppercase">
              Soon
            </span>
          ) : null}
        </h3>
        <p className="mt-2 text-muted-foreground text-sm leading-6">
          {item.description}
        </p>
        {!comingSoon && (
          <Link
            className="mt-5 inline-flex min-h-11 items-center gap-1.5 font-medium text-primary text-sm hover:underline"
            href={item.href}
          >
            {item.cta} <ArrowRight className="size-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
