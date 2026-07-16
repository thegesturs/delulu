import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function IntegrationBreadcrumbs({ current }: { current?: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
      <ol className="flex min-w-0 flex-wrap items-center gap-1.5">
        <li>
          <Link
            className="inline-flex min-h-11 items-center hover:text-foreground"
            href="/"
          >
            Home
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="size-4" />
        </li>
        <li>
          {current ? (
            <Link
              className="inline-flex min-h-11 items-center hover:text-foreground"
              href="/integrations"
            >
              Integrations
            </Link>
          ) : (
            <span aria-current="page" className="text-foreground">
              Integrations
            </span>
          )}
        </li>
        {current && (
          <>
            <li aria-hidden="true">
              <ChevronRight className="size-4" />
            </li>
            <li className="min-w-0">
              <span
                aria-current="page"
                className="block max-w-full break-words text-foreground"
              >
                {current}
              </span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
