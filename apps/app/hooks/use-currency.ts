import { type CurrencyCode, getCurrencyFromCountry } from "@delulu/payments";

const GEO_COUNTRY_REGEX = /x-geo-country=([^;]+)/;

export function useCurrency(): CurrencyCode {
  const country =
    typeof document !== "undefined"
      ? document.cookie.match(GEO_COUNTRY_REGEX)?.[1]
      : null;
  return getCurrencyFromCountry(country || "US");
}
