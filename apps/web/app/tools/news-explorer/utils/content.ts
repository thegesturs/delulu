import type { FaqItem } from "@/components/tools/tool-faq";
import type { NewsRoute } from "./config";

export function newsTitle(route: NewsRoute): string {
  if (route.country && route.category) {
    return `${route.country.name} ${route.category.name} News Content Ideas for Social Media`;
  }
  if (route.country) {
    return `${route.country.name} News Content Ideas for Social Media`;
  }
  if (route.category) {
    return `Latest ${route.category.name} News Content Ideas for Social Media`;
  }
  return "Latest News Content Ideas for Social Media";
}

export function newsShortTitle(route: NewsRoute): string {
  if (route.country && route.category) {
    return `${route.country.name} ${route.category.name} News`;
  }
  if (route.country) {
    return `${route.country.name} News`;
  }
  if (route.category) {
    return `Latest ${route.category.name} News`;
  }
  return "Latest News";
}

export function newsDescription(route: NewsRoute): string {
  const focus =
    route.category?.context ??
    route.country?.context ??
    "major stories across countries and topics";
  const location = route.country
    ? ` affecting ${route.country.name}`
    : " from publishers around the world";
  return `Find current headlines about ${focus}${location} for timely social media content ideas. Open the original reporting and create an attributed draft — free, with no signup.`;
}

export function newsIntro(route: NewsRoute): string[] {
  if (route.country && route.category) {
    return [
      `Track ${route.category.name.toLowerCase()} reporting connected to ${route.country.name}, with headlines spanning ${route.category.context}. Use the focused feed to find timely news-based content ideas while keeping the original publisher one click away.`,
      "Compare how publishers frame a developing story, read the complete source, and add a useful perspective for your audience. The feed shows only headline-level details and short source-provided summaries; the full reporting stays with its publisher.",
    ];
  }
  if (route.country) {
    return [
      `Follow current reporting from and about ${route.country.name}, including ${route.country.context}. The focused feed helps social media managers and creators spot timely stories without opening dozens of publisher home pages.`,
      `Each result identifies its publisher and links to the original story. Read the source before posting, then use the topic links to narrow ${route.country.name} coverage to business, technology, entertainment, sports, science, health, or world news.`,
    ];
  }
  if (route.category) {
    return [
      `Scan the latest ${route.category.name.toLowerCase()} headlines covering ${route.category.context}. The explorer helps you find news-based social media content ideas while preserving clear publisher attribution and direct source links.`,
      "Choose a country to focus the feed, or open a story at its publisher for the complete report. When a headline fits your audience, send a short attributed draft to the Delulu composer and add your own perspective.",
    ];
  }
  return [
    "Find timely news content ideas for social media across countries and topics without an account. Browse the full cached feed, open the original reporting, or use a relevant headline as the starting point for content tailored to your audience.",
    "We show publisher attribution, publication time, links, and only short feed-provided summaries when available. Full article text stays on the publisher's site, where context, corrections, and access terms remain authoritative.",
  ];
}

export function newsFaq(route: NewsRoute): FaqItem[] {
  const title = newsShortTitle(route);
  const subject = route.category ? route.category.name.toLowerCase() : "news";
  const place = route.country?.name ?? "the selected country";
  const contextualQuestion =
    route.country && route.category
      ? {
          question: `What counts as ${route.country.name} ${subject} news here?`,
          answer: `The feed combines the ${route.country.name} edition with a ${route.category.name} topic filter. That generally surfaces reporting about ${route.category.context} that is relevant to readers following ${route.country.context}.`,
        }
      : route.country
        ? {
            question: `Can I filter ${route.country.name} news by topic?`,
            answer: `Yes. Use the topic links on this page to open dedicated ${route.country.name} pages for business, technology, entertainment, sports, science, health, or world coverage.`,
          }
        : route.category
          ? {
              question: `Can I view ${route.category.name.toLowerCase()} news for one country?`,
              answer: `Yes. Choose any supported country to combine its regional edition with the ${route.category.name} topic. Each combination opens a page you can bookmark or share.`,
            }
          : {
              question: "How do I explore news by country or category?",
              answer:
                "Choose a country, a topic, or both from the filters. You can bookmark or share the resulting news view.",
            };

  const localContextQuestion = route.country
    ? {
        question: `What context matters when reading ${route.country.name} ${subject} headlines?`,
        answer: `Check whether a story concerns ${route.country.context}, which jurisdiction or region it covers, and when the publisher updated it. A headline relevant to ${route.country.name} can still originate from an international publisher, so open the complete report before sharing it.`,
      }
    : {
        question: `How broad is this ${subject} feed?`,
        answer: route.category
          ? `It scans reporting about ${route.category.context} across country editions. Choose a country on the tool to focus that same ${route.category.name.toLowerCase()} topic geographically.`
          : "It combines major current stories across topics and regions. Use the country and topic controls when you need a narrower editorial lens.",
      };

  const relatedViewQuestion = route.category
    ? {
        question: `Which views are useful alongside ${title}?`,
        answer: route.country
          ? `Compare this page with the broader ${route.country.name} news edition and the global ${route.category.name} news edition. That makes it easier to see whether a story is locally prominent or part of a wider trend.`
          : `Open a country-specific ${route.category.name.toLowerCase()} edition to compare global coverage with a regional feed, or return to Latest News for stories outside ${route.category.context}.`,
      }
    : {
        question: `How can I narrow ${title}?`,
        answer: route.country
          ? `Choose business, technology, entertainment, sports, science, health, or world to narrow ${route.country.name} reporting while keeping the same country edition.`
          : "Choose one of seven topics, one of 52 country editions, or combine both. Every selection opens a page you can bookmark or share.",
      };

  return [
    contextualQuestion,
    localContextQuestion,
    relatedViewQuestion,
    {
      question: `Is ${title} free to use?`,
      answer:
        "Yes. All available cached headlines are visible without login, blur, subscription prompt, or daily cap.",
    },
    {
      question: `How fresh are these ${subject} headlines?`,
      answer:
        "Headlines are saved for 15 minutes before we check for updates. If the source is slow or unavailable, we keep the most recent results visible and clearly label older headlines.",
    },
    {
      question: "Where do the headlines come from?",
      answer:
        "Headlines come from a public aggregation feed. We keep the publisher, date, source link, and optional short feed summary or image. The source is not presented as an official commercial API.",
    },
    {
      question: "Does News Explorer republish full articles?",
      answer:
        "No. We show headline-level feed data and an optional short excerpt only. The Open source action takes you to the publisher for the complete article.",
    },
    {
      question: "What does Create post in Delulu add to the composer?",
      answer: `It prepares an editable draft with the headline, publisher attribution, and source link. Review the ${place} context, verify the original reporting, and add your own perspective before publishing.`,
    },
  ];
}
