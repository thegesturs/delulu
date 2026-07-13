import { callbackRedirect } from "../../callback-response";
import type { CallbackContext, PlatformAuth } from "../../types";
import { CONNECT_URL } from "./constants";

/**
 * Farcaster has no standard OAuth. Connecting happens through Warpcast's
 * signed-key-request (signer approval) flow, which lives in the app route
 * (`apps/app/app/api/farcaster/connect`) — it generates an Ed25519 keypair,
 * signs an EIP-712 signed-key-request, and polls Warpcast for approval. There is
 * no OAuth-style code exchange callback to port here, so `getConnectUrl` returns
 * the static Warpcast URL and `handleCallback` simply redirects to the socials
 * success page.
 */
export const farcasterAuth: PlatformAuth = {
  scopes: [],
  isMultiStep: false,

  getConnectUrl(): string {
    return CONNECT_URL;
  },

  handleCallback(_ctx: CallbackContext): Promise<Response> {
    return Promise.resolve(
      callbackRedirect("/socials?success=true&provider=farcaster")
    );
  },
};
