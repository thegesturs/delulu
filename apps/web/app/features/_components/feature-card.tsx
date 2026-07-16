import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@delulu/design-system/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Feature } from "../features";

export function FeatureCard({ feature }: { readonly feature: Feature }) {
  const Icon = feature.icon;

  return (
    <Link className="group block h-full" href={`/features/${feature.slug}`}>
      <Card className="h-full border-border transition-colors group-hover:border-primary/60">
        <CardHeader>
          <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon
              aria-hidden
              className={`size-5 ${feature.iconClassName ?? ""}`}
            />
          </span>
          <p className="font-semibold text-primary text-xs uppercase tracking-[0.18em]">
            {feature.job}
          </p>
          <CardTitle className="flex items-start justify-between gap-3 text-xl leading-7">
            {feature.title}
            <ArrowRight
              aria-hidden
              className="mt-1 size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-7">{feature.summary}</p>
          <span className="mt-5 inline-flex min-h-11 items-center font-semibold text-sm">
            Explore the workflow
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
