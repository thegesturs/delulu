export const PREVIEWS_INDEX_KEY = "index:previews";

export function metaKey(slug: string): string {
  return `meta:${slug}`;
}

export function articleObjectKey(slug: string): string {
  return `articles/${slug}.json`;
}
