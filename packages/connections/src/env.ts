/**
 * Lazy, isomorphic env reader. Works on both Node (Lambda worker) and workerd
 * (Cloudflare, via `nodejs_compat` + `keep_vars`) because both expose the
 * relevant values on `process.env`. Read lazily so importing the module never
 * throws when a var is absent at build time.
 */
export const env = () => ({
  INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID ?? "",
  INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET ?? "",
  INSTAGRAM_CALLBACK_URL: process.env.INSTAGRAM_CALLBACK_URL ?? "",
});
