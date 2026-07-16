import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import { socialBackgroundColors } from "@delulu/design-system/lib/social-config";
import { cn } from "@delulu/design-system/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  availabilityLabels,
  type IntegrationPageDefinition,
} from "../_lib/integration-pages";

export function IntegrationCard({
  integration,
}: {
  integration: IntegrationPageDefinition;
}) {
  return (
    <Link
      className="group flex min-w-0 flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-foreground/25 hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6"
      href={`/integrations/${integration.slug}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm",
            socialBackgroundColors[integration.platform]
          )}
        >
          <SocialIcon
            className="size-5 text-white"
            size="lg"
            type={integration.platform}
          />
        </span>
        <span className="max-w-[12rem] rounded-full border bg-background px-2.5 py-1 text-right text-muted-foreground text-xs leading-4">
          {availabilityLabels[integration.availability]}
        </span>
      </div>
      <h3 className="mt-5 font-semibold text-xl tracking-tight">
        {integration.name}
      </h3>
      <p className="mt-2 flex-1 text-muted-foreground text-sm leading-6">
        {integration.description}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {integration.workflows.map((workflow) => (
          <span
            className="rounded-full bg-muted px-2.5 py-1 text-foreground/75 text-xs"
            key={workflow}
          >
            {workflow}
          </span>
        ))}
      </div>
      <span className="mt-6 inline-flex min-h-11 items-center gap-2 font-medium text-sm">
        Explore {integration.name}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
