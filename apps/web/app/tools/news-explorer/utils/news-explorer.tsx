import { Button } from "@delulu/design-system/components/ui/button";
import { ArrowUpRight, Clock, PenLine } from "lucide-react";
import { ComposerHandoffLink } from "@/components/tools/composer-handoff-link";
import { createComposerHandoffUrl } from "@/lib/composer-handoff";
import type { NewsItem } from "./provider";
import type { NewsResult } from "./service";

const relativeTime = (publishedAt: string) => {
  const elapsed = Date.now() - new Date(publishedAt).getTime();
  const hours = Math.max(1, Math.round(elapsed / 3_600_000));
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
};

const createPostUrl = (item: NewsItem) => {
  const content = `${item.headline}\n\nSource: ${item.source}\n${item.url}`;
  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://solulu.delulu.social";
  return createComposerHandoffUrl(new URL("/post", base).toString(), content);
};

const articleDescription = (item: NewsItem) =>
  item.excerpt ??
  `Reporting from ${item.source}. Open the original story for full context and the latest updates.`;

export function NewsExplorer({ initial }: { initial: NewsResult }) {
  return (
    <section aria-label="Latest headlines" className="-mx-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-zinc-950/10 border-y-[1.5px] border-dotted px-4 py-3 text-muted-foreground text-xs tabular-nums sm:px-5 dark:border-white/10">
        <span>{initial.items.length} headlines</span>
        <span className="flex items-center gap-1.5">
          <Clock aria-hidden="true" className="size-3.5" />
          Updated {new Date(initial.fetchedAt).toLocaleString()}
        </span>
      </div>

      {initial.message ? (
        <p className="border-zinc-950/10 border-b-[1.5px] border-dotted bg-amber-50 px-4 py-3 text-amber-900 text-sm sm:px-5 dark:border-white/10 dark:bg-amber-950/30 dark:text-amber-200">
          {initial.message}
        </p>
      ) : null}

      {initial.items.length > 0 ? (
        <ol className="grid grid-cols-1 border-zinc-950/15 border-y-[1.5px] border-dotted sm:grid-cols-2 lg:grid-cols-3 dark:border-white/15">
          {initial.items.map((item) => (
            <li
              className="min-w-0 border-zinc-950/15 border-b-[1.5px] border-dotted p-4 sm:border-r-[1.5px] dark:border-white/15 sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r-[1.5px] lg:[&:nth-child(3n)]:border-r-0"
              key={item.id}
            >
              <article className="flex h-full min-h-72 flex-col rounded-xl border bg-card p-5 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center gap-x-2 text-muted-foreground text-xs">
                  {item.sourceUrl ? (
                    <a
                      className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                      href={item.sourceUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {item.source}
                    </a>
                  ) : (
                    <span className="font-medium text-foreground">
                      {item.source}
                    </span>
                  )}
                  <span aria-hidden="true">·</span>
                  <time dateTime={item.publishedAt}>
                    {relativeTime(item.publishedAt)}
                  </time>
                </div>

                <h2 className="line-clamp-3 text-balance font-semibold text-lg leading-7">
                  {item.headline}
                </h2>
                <p className="mt-3 line-clamp-3 text-muted-foreground text-sm leading-6">
                  {articleDescription(item)}
                </p>

                <div className="mt-auto grid gap-2 pt-6">
                  <Button asChild className="" variant="outline">
                    <a
                      href={item.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Open source
                      <ArrowUpRight aria-hidden="true" className="size-4" />
                    </a>
                  </Button>
                  <Button asChild className="">
                    <ComposerHandoffLink handoffUrl={createPostUrl(item)}>
                      Create in Delulu
                      <PenLine aria-hidden="true" className="size-4" />
                    </ComposerHandoffLink>
                  </Button>
                </div>
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <p className="border-zinc-950/10 border-b-[1.5px] border-dotted p-10 text-center text-muted-foreground text-sm dark:border-white/10">
          No headlines are available right now. Please try again shortly.
        </p>
      )}
    </section>
  );
}
