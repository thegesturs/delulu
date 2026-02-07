import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode, { type Options } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { codeImport } from "remark-code-import";
import remarkGfm from "remark-gfm";
import { createHighlighter } from "shiki";
import { z } from "zod";

const prettyCodeOptions: Options = {
  theme: {
    dark: "github-dark",
    light: "github-light",
  },
  keepBackground: true,
  getHighlighter: (options) =>
    createHighlighter({
      ...options,
      themes: ["github-dark", "github-light"],
    }),
  onVisitLine(node) {
    if (node.children.length === 0) {
      node.children = [{ type: "text", value: " " }];
    }
  },
  onVisitHighlightedLine(node) {
    if (!node.properties.className) {
      node.properties.className = [];
    }
    node.properties.className.push("line--highlighted");
  },
  onVisitHighlightedChars(node) {
    if (!node.properties.className) {
      node.properties.className = [];
    }
    node.properties.className = ["word--highlighted"];
  },
};

const blogs = defineCollection({
  name: "blogs",
  directory: "data/blogs",
  include: "*.mdx",
  schema: z.object({
    title: z.string(),
    date: z.string(),
    author: z.string().default("Swaraj Bachu"),
    authorAvatar: z.string().optional(),
    description: z.string().default("Delulu - The Social Platform"),
    image: z.string().optional(),
    categories: z.array(z.string()).default(["trending"]),
    keywords: z
      .array(z.string())
      .default(["delulu", "social", "platform", "scheduling"]),
  }),
  transform: async (document, context) => {
    const body = await compileMDX(context, document, {
      remarkPlugins: [codeImport, remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypePrettyCode, prettyCodeOptions],
        [
          rehypeAutolinkHeadings,
          {
            properties: {
              className: ["subheading-anchor"],
              ariaLabel: "Link to section",
            },
          },
        ],
      ],
    });
    const slug = document._meta.path;
    return {
      ...document,
      body,
      slug,
    };
  },
});

const legal = defineCollection({
  name: "legals",
  directory: "data/legal",
  include: "*.mdx",
  schema: z.object({
    title: z.string(),
    date: z.string(),
  }),
  transform: async (document, context) => {
    const body = await compileMDX(context, document, {
      remarkPlugins: [codeImport, remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypePrettyCode, prettyCodeOptions],
        [
          rehypeAutolinkHeadings,
          {
            properties: {
              className: ["subheading-anchor"],
              ariaLabel: "Link to section",
            },
          },
        ],
      ],
    });
    const slug = document._meta.path;
    return {
      ...document,
      body,
      slug,
    };
  },
});

export default defineConfig({
  collections: [blogs, legal],
});
