import { categoryBySlug, countryBySlug } from "../utils/config";
import { getNewsForRequest } from "../utils/service";

export async function GET(request: Request): Promise<Response> {
  const parameters = new URL(request.url).searchParams;
  const countrySlug = parameters.get("country");
  const categorySlug = parameters.get("category");
  const country = countrySlug ? countryBySlug.get(countrySlug) : undefined;
  const category = categorySlug ? categoryBySlug.get(categorySlug) : undefined;
  if ((countrySlug && !country) || (categorySlug && !category)) {
    return Response.json(
      { message: "Unknown news country or category." },
      { status: 400 }
    );
  }
  const result = await getNewsForRequest({ country, category });
  return Response.json(result, {
    headers: {
      "Cache-Control":
        "public, max-age=60, s-maxage=900, stale-while-revalidate=21600",
    },
  });
}
