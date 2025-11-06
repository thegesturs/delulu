'use client';

/**
 * UserJot Analytics Component
 *
 * Loads UserJot SDK for user feedback and analytics.
 * Uses Next.js Script component with afterInteractive strategy
 * to avoid blocking page rendering.
 */

import Script from 'next/script';

export function UserJot() {
  return (
    <>
      {/* UserJot SDK - Initialize global proxy */}
      <Script
        id="userjot-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html:
            'window.$ujq=window.$ujq||[];window.uj=window.uj||new Proxy({},{get:(_,p)=>(...a)=>window.$ujq.push([p,...a])});',
        }}
      />
      {/* UserJot SDK - Load main module */}
      <Script
        src="https://cdn.userjot.com/sdk/v2/uj.js"
        strategy="afterInteractive"
        type="module"
      />
    </>
  );
}
