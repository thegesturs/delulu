import type { CloudflareEnv } from "@delulu/cloudflare-types";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends CloudflareEnv {}
  }
}

export type {};
