export interface NewsCountry {
  slug: string;
  name: string;
  code: string;
  emoji: string;
  locale: string;
  context: string;
}

export interface NewsCategory {
  slug: string;
  name: string;
  providerTopic: string;
  context: string;
}

const country = (
  slug: string,
  name: string,
  code: string,
  context: string,
  locale = "en"
): NewsCountry => ({
  slug,
  name,
  code,
  emoji: String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((character) => 127_397 + character.charCodeAt(0))
  ),
  locale,
  context,
});

export const NEWS_COUNTRIES: readonly NewsCountry[] = [
  country(
    "argentina",
    "Argentina",
    "AR",
    "national affairs and the Southern Cone"
  ),
  country(
    "australia",
    "Australia",
    "AU",
    "federal policy and the Asia-Pacific region"
  ),
  country(
    "austria",
    "Austria",
    "AT",
    "central European affairs and Austrian public life"
  ),
  country(
    "belgium",
    "Belgium",
    "BE",
    "Belgian affairs and European institutions"
  ),
  country("brazil", "Brazil", "BR", "Brazilian public life and Latin America"),
  country(
    "bulgaria",
    "Bulgaria",
    "BG",
    "Bulgarian affairs and southeast Europe"
  ),
  country(
    "canada",
    "Canada",
    "CA",
    "federal, provincial, and North American affairs"
  ),
  country(
    "chile",
    "Chile",
    "CL",
    "Chilean affairs and the Pacific coast of South America"
  ),
  country(
    "china",
    "China",
    "CN",
    "developments in China and their global impact"
  ),
  country(
    "colombia",
    "Colombia",
    "CO",
    "Colombian affairs and northern South America"
  ),
  country(
    "croatia",
    "Croatia",
    "HR",
    "Croatian affairs and the Adriatic region"
  ),
  country(
    "czech-republic",
    "Czech Republic",
    "CZ",
    "Czech affairs and central Europe"
  ),
  country("denmark", "Denmark", "DK", "Danish affairs and the Nordic region"),
  country("egypt", "Egypt", "EG", "Egyptian affairs and the wider Middle East"),
  country("estonia", "Estonia", "EE", "Estonian affairs and the Baltic region"),
  country("finland", "Finland", "FI", "Finnish affairs and the Nordic region"),
  country("france", "France", "FR", "French public life and European affairs"),
  country(
    "germany",
    "Germany",
    "DE",
    "German public life and European affairs"
  ),
  country(
    "greece",
    "Greece",
    "GR",
    "Greek affairs and the eastern Mediterranean"
  ),
  country(
    "hong-kong",
    "Hong Kong",
    "HK",
    "Hong Kong affairs and regional markets"
  ),
  country("hungary", "Hungary", "HU", "Hungarian affairs and central Europe"),
  country("india", "India", "IN", "national, state, and South Asian affairs"),
  country(
    "indonesia",
    "Indonesia",
    "ID",
    "Indonesian affairs and southeast Asia"
  ),
  country("ireland", "Ireland", "IE", "Irish public life and European affairs"),
  country(
    "israel",
    "Israel",
    "IL",
    "Israeli affairs and the wider Middle East"
  ),
  country(
    "italy",
    "Italy",
    "IT",
    "Italian public life and Mediterranean affairs"
  ),
  country("japan", "Japan", "JP", "Japanese affairs and east Asia"),
  country("latvia", "Latvia", "LV", "Latvian affairs and the Baltic region"),
  country(
    "lithuania",
    "Lithuania",
    "LT",
    "Lithuanian affairs and the Baltic region"
  ),
  country("malaysia", "Malaysia", "MY", "Malaysian affairs and southeast Asia"),
  country("mexico", "Mexico", "MX", "Mexican public life and North America"),
  country(
    "netherlands",
    "Netherlands",
    "NL",
    "Dutch public life and European affairs"
  ),
  country(
    "new-zealand",
    "New Zealand",
    "NZ",
    "New Zealand affairs and the South Pacific"
  ),
  country("nigeria", "Nigeria", "NG", "Nigerian public life and west Africa"),
  country("norway", "Norway", "NO", "Norwegian affairs and the Nordic region"),
  country(
    "philippines",
    "Philippines",
    "PH",
    "Philippine affairs and southeast Asia"
  ),
  country("poland", "Poland", "PL", "Polish public life and central Europe"),
  country(
    "portugal",
    "Portugal",
    "PT",
    "Portuguese affairs and the Atlantic region"
  ),
  country("romania", "Romania", "RO", "Romanian affairs and southeast Europe"),
  country(
    "saudi-arabia",
    "Saudi Arabia",
    "SA",
    "Saudi affairs and the Gulf region"
  ),
  country(
    "singapore",
    "Singapore",
    "SG",
    "Singapore affairs and southeast Asian markets"
  ),
  country("slovakia", "Slovakia", "SK", "Slovak affairs and central Europe"),
  country("slovenia", "Slovenia", "SI", "Slovenian affairs and central Europe"),
  country(
    "south-africa",
    "South Africa",
    "ZA",
    "South African public life and southern Africa"
  ),
  country(
    "south-korea",
    "South Korea",
    "KR",
    "South Korean affairs and east Asia"
  ),
  country("spain", "Spain", "ES", "Spanish public life and European affairs"),
  country("sweden", "Sweden", "SE", "Swedish affairs and the Nordic region"),
  country(
    "switzerland",
    "Switzerland",
    "CH",
    "Swiss affairs and European markets"
  ),
  country("taiwan", "Taiwan", "TW", "Taiwanese affairs and east Asia"),
  country(
    "turkey",
    "Turkey",
    "TR",
    "Turkish affairs and the eastern Mediterranean"
  ),
  country(
    "united-kingdom",
    "United Kingdom",
    "GB",
    "UK public life and its four nations"
  ),
  country(
    "united-states",
    "United States",
    "US",
    "federal, state, and North American affairs"
  ),
] as const;

export const NEWS_CATEGORIES: readonly NewsCategory[] = [
  {
    slug: "business",
    name: "Business",
    providerTopic: "BUSINESS",
    context: "companies, markets, trade, and the economy",
  },
  {
    slug: "technology",
    name: "Technology",
    providerTopic: "TECHNOLOGY",
    context: "software, devices, science-led products, and the digital economy",
  },
  {
    slug: "entertainment",
    name: "Entertainment",
    providerTopic: "ENTERTAINMENT",
    context: "film, television, music, books, and culture",
  },
  {
    slug: "sports",
    name: "Sports",
    providerTopic: "SPORTS",
    context: "teams, athletes, competitions, and results",
  },
  {
    slug: "science",
    name: "Science",
    providerTopic: "SCIENCE",
    context: "research, space, climate, and new discoveries",
  },
  {
    slug: "health",
    name: "Health",
    providerTopic: "HEALTH",
    context: "public health, medicine, wellbeing, and healthcare systems",
  },
  {
    slug: "world",
    name: "World",
    providerTopic: "WORLD",
    context: "international affairs, diplomacy, conflict, and global events",
  },
] as const;

export const countryBySlug = new Map(
  NEWS_COUNTRIES.map((item) => [item.slug, item])
);
export const categoryBySlug = new Map(
  NEWS_CATEGORIES.map((item) => [item.slug, item])
);

export interface NewsRoute {
  country?: NewsCountry;
  category?: NewsCategory;
}

export const NEWS_FAMILY_PATH = "/tools/news-explorer";

export function newsToolSlug(route: NewsRoute): string {
  if (route.country && route.category) {
    return `${route.country.slug}-${route.category.slug}-news`;
  }
  if (route.country) {
    return `${route.country.slug}-news`;
  }
  if (route.category) {
    return `${route.category.slug}-news`;
  }
  return "latest-news";
}

export function allNewsRoutes(): NewsRoute[] {
  return [
    {},
    ...NEWS_COUNTRIES.map((item) => ({ country: item })),
    ...NEWS_CATEGORIES.map((item) => ({ category: item })),
    ...NEWS_COUNTRIES.flatMap((countryItem) =>
      NEWS_CATEGORIES.map((categoryItem) => ({
        country: countryItem,
        category: categoryItem,
      }))
    ),
  ];
}

const routeByToolSlug = new Map(
  allNewsRoutes().map((route) => [newsToolSlug(route), route])
);

export const parseNewsToolSlug = (slug: string): NewsRoute | null =>
  routeByToolSlug.get(slug) ?? null;

export const newsRoutePath = (route: NewsRoute): string =>
  `${NEWS_FAMILY_PATH}/${newsToolSlug(route)}`;

const INDEXABLE_COUNTRIES = new Set([
  "australia",
  "brazil",
  "canada",
  "france",
  "germany",
  "india",
  "japan",
  "south-africa",
  "united-kingdom",
  "united-states",
]);

const INDEXABLE_COMBINATIONS = new Set([
  "australia/technology",
  "brazil/business",
  "canada/business",
  "france/world",
  "germany/business",
  "india/technology",
  "japan/technology",
  "south-africa/world",
  "united-kingdom/business",
  "united-kingdom/technology",
  "united-states/business",
  "united-states/technology",
]);

export function isIndexableNewsRoute(route: NewsRoute): boolean {
  if (!(route.country || route.category)) {
    return true;
  }
  if (route.country && route.category) {
    return INDEXABLE_COMBINATIONS.has(
      `${route.country.slug}/${route.category.slug}`
    );
  }
  return route.country ? INDEXABLE_COUNTRIES.has(route.country.slug) : true;
}

export function indexableNewsRoutes(): NewsRoute[] {
  return [
    {},
    ...NEWS_COUNTRIES.filter((item) => INDEXABLE_COUNTRIES.has(item.slug)).map(
      (item) => ({ country: item })
    ),
    ...NEWS_CATEGORIES.map((item) => ({ category: item })),
    ...NEWS_COUNTRIES.flatMap((countryItem) =>
      NEWS_CATEGORIES.filter((categoryItem) =>
        INDEXABLE_COMBINATIONS.has(`${countryItem.slug}/${categoryItem.slug}`)
      ).map((categoryItem) => ({
        country: countryItem,
        category: categoryItem,
      }))
    ),
  ];
}
