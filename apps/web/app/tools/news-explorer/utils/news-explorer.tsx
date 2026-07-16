"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { ArrowUpRight, Clock, PenLine, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  NEWS_CATEGORIES,
  NEWS_COUNTRIES,
  type NewsRoute,
  newsRoutePath,
} from "./config";
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
  const url = new URL("/post", base);
  url.searchParams.set("content", content);
  url.searchParams.set("source", "news-explorer");
  return url.toString();
};

export function NewsExplorer({
  initial,
  route,
}: {
  initial: NewsResult;
  route: NewsRoute;
}) {
  const [result, setResult] = useState(initial);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const items = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return needle
      ? result.items.filter((item) =>
          `${item.headline} ${item.source}`.toLocaleLowerCase().includes(needle)
        )
      : result.items;
  }, [query, result.items]);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      const parameters = new URLSearchParams();
      if (route.country) {
        parameters.set("country", route.country.slug);
      }
      if (route.category) {
        parameters.set("category", route.category.slug);
      }
      const response = await fetch(`/tools/news-explorer/api?${parameters}`);
      if (!response.ok) {
        throw new Error(`Refresh returned ${response.status}`);
      }
      setResult(await response.json());
    } catch {
      setResult((current) => ({
        ...current,
        state: current.items.length > 0 ? "stale" : "error",
        message:
          "The refresh did not complete. Keeping the latest cached headlines on screen.",
      }));
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-muted/30 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            <span className="mb-1.5 block font-medium">
              Search cached headlines
            </span>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search headline or publisher"
              type="search"
              value={query}
            />
          </label>
          <Button
            disabled={isRefreshing}
            onClick={refresh}
            type="button"
            variant="outline"
          >
            <RefreshCw
              className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Check for updates
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link
            className="rounded-full border bg-background px-3 py-1 hover:border-primary"
            href={newsRoutePath({})}
          >
            All news
          </Link>
          {NEWS_CATEGORIES.map((category) => (
            <Link
              className="rounded-full border bg-background px-3 py-1 hover:border-primary"
              href={newsRoutePath({ ...route, category })}
              key={category.slug}
            >
              {category.name}
            </Link>
          ))}
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            Choose a country
          </summary>
          <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto pb-1">
            {NEWS_COUNTRIES.map((country) => (
              <Link
                className="rounded-full border bg-background px-3 py-1 hover:border-primary"
                href={newsRoutePath({ ...route, country })}
                key={country.slug}
              >
                {country.name}
              </Link>
            ))}
          </div>
        </details>
      </div>

      <div
        aria-live="polite"
        className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 text-muted-foreground text-xs sm:px-5"
      >
        <span>
          {items.length} of {result.items.length} cached headlines
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" /> Updated{" "}
          {new Date(result.fetchedAt).toLocaleString()}
        </span>
      </div>
      {result.message ? (
        <p className="border-b bg-amber-50 px-4 py-3 text-amber-900 text-sm dark:bg-amber-950/30 dark:text-amber-200">
          {result.message}
        </p>
      ) : null}

      {items.length > 0 ? (
        <ol className="divide-y">
          {items.map((item) => (
            <li className="p-4 sm:p-5" key={item.id}>
              <article className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-x-2 text-muted-foreground text-xs">
                    {item.sourceUrl ? (
                      <a
                        className="font-medium text-foreground hover:underline"
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
                  <h2 className="font-semibold text-lg leading-7">
                    {item.headline}
                  </h2>
                  {item.excerpt ? (
                    <p className="mt-2 line-clamp-2 text-muted-foreground text-sm leading-6">
                      {item.excerpt}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2 sm:flex-col sm:items-stretch">
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={item.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Open source <ArrowUpRight className="size-4" />
                    </a>
                  </Button>
                  <Button asChild size="sm">
                    <a href={createPostUrl(item)} rel="noopener noreferrer">
                      Create this post in Delulu <PenLine className="size-4" />
                    </a>
                  </Button>
                </div>
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <p className="p-8 text-center text-muted-foreground">
          {query
            ? "No cached headlines match that search."
            : "No headlines are available right now. Please try again shortly."}
        </p>
      )}
    </section>
  );
}
