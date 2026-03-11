# Clerk Chrome Extension Cookie Patch

## Problem

`@clerk/chrome-extension@2.9.2` looks for a cookie named `__clerk_uat` to detect active sessions via the sync host mechanism. However, the production Clerk frontend (`@clerk/nextjs`) sets the cookie as `__client_uat`.

This mismatch means the Chrome extension never detects the user's session from the sync host, and auth silently fails (popup always shows signed-out state).

## Root Cause

The Clerk Chrome extension SDK and the Clerk Next.js SDK are out of sync on the cookie name:

| Package | Cookie Name Used |
|---|---|
| `@clerk/chrome-extension@2.9.2` | `__clerk_uat` (reads) |
| `@clerk/nextjs` (production) | `__client_uat` (writes) |

The constant is defined in:
```
node_modules/@clerk/chrome-extension/dist/esm/chunk-3LGXNEQ5.js
→ var CLIENT_UAT_KEY = "__clerk_uat";
```

## Patch Applied

We use `pnpm patch` to replace `__clerk_uat` → `__client_uat` in the SDK bundle.

**Patch file:** `patches/@clerk__chrome-extension@2.9.2.patch`

The patch is auto-applied on `pnpm install` via pnpm's `patchedDependencies` in `pnpm-lock.yaml`.

## Other Production Auth Findings

During debugging, we also discovered:

1. **Sync host must be `clerk.delulu.social`** (the FAPI proxy), NOT `solulu.delulu.social` (the web app). The `__client` JWT cookie is set on `.clerk.delulu.social`, and the SDK reads it from the sync host URL. If sync host is set to the web app domain, `chrome.cookies.get` won't find the JWT.

2. **`host_permissions` needs `https://*.delulu.social/*`** — the `__client_uat` cookie is set on `.delulu.social` (parent domain). Without wildcard subdomain access, `chrome.cookies` API can't read it.

3. **Sign-in URL uses a separate env var** (`VITE_CLERK_APP_URL`) pointing to `solulu.delulu.social`, since `VITE_CLERK_SYNC_HOST` now points to the FAPI proxy and shouldn't be used for user-facing redirects.

## How to Test After Updating `@clerk/chrome-extension`

1. **Update the package:**
   ```bash
   pnpm update @clerk/chrome-extension
   ```

2. **Check if the cookie name was fixed upstream:**
   ```bash
   grep "clerk_uat\|client_uat" node_modules/@clerk/chrome-extension/dist/esm/*.js
   ```
   - If you see `var CLIENT_UAT_KEY = "__client_uat"` → the fix is upstream, **remove the patch**
   - If you still see `var CLIENT_UAT_KEY = "__clerk_uat"` → patch is still needed

3. **Test auth in the extension:**
   - Build: `npx wxt build --mode production`
   - Load unpacked from `.output/chrome-mv3`
   - Sign in on `solulu.delulu.social` in the browser
   - Open extension popup — should show signed-in state
   - Open service worker console (`chrome://extensions` → Inspect) and run:
     ```js
     chrome.cookies.get({name: "__client_uat", url: "https://clerk.delulu.social"}, c => console.log(c))
     ```
     Should return a cookie with a timestamp value (not `null` or `"0"`)

4. **If removing the patch:**
   ```bash
   # Remove patch file
   rm patches/@clerk__chrome-extension@2.9.2.patch
   # Reinstall to clear patched version
   pnpm install
   # Rebuild and test
   ```

## Env Vars Reference

| Var | Dev | Production | Purpose |
|---|---|---|---|
| `VITE_CLERK_SYNC_HOST` | `http://localhost:3000` | `https://clerk.delulu.social` | Cookie sync domain (where `__client` JWT lives) |
| `VITE_CLERK_APP_URL` | `http://localhost:3000` | `https://solulu.delulu.social` | User-facing sign-in redirect URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` | Clerk publishable key |
