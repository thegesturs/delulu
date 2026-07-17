import { describe, expect, it } from "vitest";
import { deduplicateNews, parseNewsFeed } from "./provider";

const FEED = `<?xml version="1.0"?><rss><channel>
  <item><title><![CDATA[Alpha &amp; beta]]></title><link>https://publisher.example/story-1?utm=x</link><pubDate>Wed, 16 Jul 2026 10:00:00 GMT</pubDate><source url="https://publisher.example">Daily Example</source><description><![CDATA[<p>A short summary.</p>]]></description><media:content url="https://publisher.example/image.jpg" /></item>
  <item><title>Second headline</title><link>https://another.example/story-2</link><pubDate>Wed, 16 Jul 2026 09:00:00 GMT</pubDate><source>Another Publisher</source></item>
</channel></rss>`;

describe("news feed normalization", () => {
  it("keeps headline-level fields and optional feed details", () => {
    const items = parseNewsFeed(FEED);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      headline: "Alpha & beta",
      source: "Daily Example",
      sourceUrl: "https://publisher.example/",
      url: "https://publisher.example/story-1?utm=x",
      excerpt: "A short summary.",
      imageUrl: "https://publisher.example/image.jpg",
    });
    expect(items[0]).not.toHaveProperty("articleBody");
  });

  it("deduplicates matching links and normalized headlines", () => {
    const [first, second] = parseNewsFeed(FEED);
    expect(
      deduplicateNews([
        first!,
        {
          ...first!,
          id: "duplicate-url",
          url: "https://publisher.example/story-1#section",
        },
        {
          ...second!,
          id: "duplicate-title",
          headline: first!.headline.toUpperCase(),
        },
        second!,
      ])
    ).toEqual([first, second]);
  });
});
