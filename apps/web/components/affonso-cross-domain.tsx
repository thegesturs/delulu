"use client";

import { useEffect } from "react";

/**
 * Appends the `affonso_referral` cookie value as an `aff` query parameter
 * to every `<a>` tag that links to the app domain. This enables cross-domain
 * affiliate tracking when the marketing site and app are on separate origins.
 *
 * The Affonso pixel sets the `affonso_referral` cookie on the marketing site.
 * When the user clicks through to the app, the referral ID is carried over in
 * the URL so the app can read it and pass it to the Dodo checkout metadata.
 */
export function AffonsoCrossDomain() {
  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("affonso_referral="));

    if (!cookie) return;

    const referralId = cookie.split("=")[1];
    if (!referralId) return;

    const appHost = process.env.NEXT_PUBLIC_APP_URL ?? "solulu.delulu.social";

    const links = document.querySelectorAll<HTMLAnchorElement>("a[href]");
    for (const link of links) {
      try {
        const url = new URL(link.href);
        if (url.hostname === new URL(appHost).hostname) {
          url.searchParams.set("aff", referralId);
          link.href = url.toString();
        }
      } catch {
        // skip relative or invalid hrefs
      }
    }
  }, []);

  return null;
}
