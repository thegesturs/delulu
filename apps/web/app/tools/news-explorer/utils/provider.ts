import type { NewsRoute } from "./config";

const SOURCE_TAG_PATTERN = /<source(?:\s[^>]*)?>([\s\S]*?)<\/source>/i;
const URL_SUFFIX_PATTERN = /[?#].*$/;
const NON_WORD_PATTERN = /\W+/g;
const LIST_MARKUP_PATTERN = /<(?:ol|ul)\b/i;

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  sourceUrl?: string;
  publishedAt: string;
  url: string;
  excerpt?: string;
  imageUrl?: string;
}

export interface NewsProvider {
  id: string;
  fetch(route: NewsRoute, signal: AbortSignal): Promise<NewsItem[]>;
}

const decodeXml = (value: string): string =>
  value
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");

const stripMarkup = (value: string): string =>
  decodeXml(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tagValue = (xml: string, tag: string): string | undefined => {
  const match = xml.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i")
  );
  return match?.[1] ? decodeXml(match[1]).trim() : undefined;
};

const attributeValue = (
  xml: string,
  tag: string,
  attribute: string
): string | undefined => {
  const match = xml.match(
    new RegExp(`<${tag}[^>]*\\s${attribute}=["']([^"']+)["'][^>]*>`, "i")
  );
  return match?.[1] ? decodeXml(match[1]) : undefined;
};

const stableId = (value: string): string => {
  let hash = 5381;
  for (const character of value) {
    hash = (hash * 33 + character.charCodeAt(0)) % 4_294_967_296;
  }
  return hash.toString(36);
};

const safeExternalUrl = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
};

export function parseNewsFeed(xml: string): NewsItem[] {
  const items = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [];
  return items.flatMap((item) => {
    const title = tagValue(item, "title");
    const url = safeExternalUrl(tagValue(item, "link"));
    const date = tagValue(item, "pubDate") ?? tagValue(item, "published");
    const rawDescription = tagValue(item, "description");
    const sourceTag = item.match(SOURCE_TAG_PATTERN);
    const source = sourceTag?.[1]
      ? stripMarkup(sourceTag[1])
      : "Original publisher";
    const sourceUrl = safeExternalUrl(attributeValue(item, "source", "url"));
    if (!(title && url && date)) {
      return [];
    }
    const publishedAt = new Date(date);
    if (Number.isNaN(publishedAt.getTime())) {
      return [];
    }
    const excerpt =
      rawDescription && !LIST_MARKUP_PATTERN.test(rawDescription)
        ? stripMarkup(rawDescription)
        : undefined;
    const imageUrl = safeExternalUrl(
      attributeValue(item, "media:content", "url") ??
        attributeValue(item, "media:thumbnail", "url") ??
        attributeValue(item, "enclosure", "url")
    );
    return [
      {
        id: stableId(`${url}|${title}`),
        headline: stripMarkup(title),
        source,
        ...(sourceUrl ? { sourceUrl } : {}),
        publishedAt: publishedAt.toISOString(),
        url,
        ...(excerpt && excerpt !== stripMarkup(title)
          ? { excerpt: excerpt.slice(0, 320) }
          : {}),
        ...(imageUrl ? { imageUrl } : {}),
      },
    ];
  });
}

export function deduplicateNews(items: readonly NewsItem[]): NewsItem[] {
  const seenUrls = new Set<string>();
  const seenHeadlines = new Set<string>();
  return items.filter((item) => {
    const normalizedUrl = item.url.replace(URL_SUFFIX_PATTERN, "");
    const normalizedHeadline = item.headline
      .toLocaleLowerCase()
      .replace(NON_WORD_PATTERN, " ")
      .trim();
    if (seenUrls.has(normalizedUrl) || seenHeadlines.has(normalizedHeadline)) {
      return false;
    }
    seenUrls.add(normalizedUrl);
    seenHeadlines.add(normalizedHeadline);
    return true;
  });
}

const localeFor = (route: NewsRoute) => {
  const code = route.country?.code ?? "US";
  const language = route.country?.locale ?? "en";
  return { code, language, hl: `${language}-${code}` };
};

export const rssNewsProvider: NewsProvider = {
  id: "rss-feed-v1",
  async fetch(route, signal) {
    const { code, language, hl } = localeFor(route);
    const topic = route.category?.providerTopic;
    const pathname = topic ? `/rss/headlines/section/topic/${topic}` : "/rss";
    const url = new URL(pathname, "https://news.google.com");
    url.searchParams.set("hl", hl);
    url.searchParams.set("gl", code);
    url.searchParams.set("ceid", `${code}:${language}`);
    const response = await fetch(url, {
      headers: { Accept: "application/rss+xml, application/xml;q=0.9" },
      signal,
    });
    if (!response.ok) {
      throw new Error(`News feed returned ${response.status}`);
    }
    return deduplicateNews(parseNewsFeed(await response.text()));
  },
};
