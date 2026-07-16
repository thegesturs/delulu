import { createFromSource } from "fumadocs-core/search/server";
import { getStructuredData, source } from "@/lib/source";

export const prerender = true;
export const { staticGET: GET } = createFromSource(source, {
  language: "english",
  buildIndex(page) {
    return {
      id: page.url,
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      structuredData: getStructuredData(page.data._raw),
    };
  },
});
