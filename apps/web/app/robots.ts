import { getWebOrigin, getWebUrl } from "@delulu/seo/url";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // General crawlers - allow all
      {
        userAgent: "*",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      // AI Chatbots & Search - ALLOW ALL for better AI search visibility
      {
        userAgent: "GPTBot",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "Claude-Web",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "FacebookBot",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "facebookexternalhit",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "meta-externalagent",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "Bingbot",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "CCBot",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "Applebot",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "Amazonbot",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      // Social media link preview crawlers
      {
        userAgent: "Twitterbot",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "LinkedInBot",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "WhatsApp",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "TelegramBot",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "SkypeUriPreview",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "Slackbot-LinkExpanding",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "DiscordBot",
        allow: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
    ],
    sitemap: getWebUrl("/sitemap.xml"),
    host: getWebOrigin(),
  };
}
