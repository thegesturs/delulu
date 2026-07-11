import { makeTokenCipher } from "@delulu/core";
import { Effect } from "effect";
import type { FixtureTables } from "./builder";

/**
 * Replace socialProviders access/refresh tokens with real AES-GCM ciphertext
 * under `secret`, so the token spot-check (verify check 5) can decrypt them.
 */
export const withEncryptedTokens = async (
  tables: FixtureTables,
  secret: string
): Promise<FixtureTables> => {
  const cipher = makeTokenCipher(secret);
  const encrypt = (plaintext: string): Promise<string> =>
    Effect.runPromise(cipher.encrypt(plaintext)).then(
      (token) => token.ciphertext
    );

  const providers = await Promise.all(
    (tables.socialProviders ?? []).map(async (raw) => {
      const provider = raw as Record<string, unknown>;
      const next: Record<string, unknown> = {
        ...provider,
        accessToken: await encrypt(String(provider.accessToken)),
      };
      if (provider.refreshToken !== undefined) {
        next.refreshToken = await encrypt(String(provider.refreshToken));
      }
      return next;
    })
  );

  return { ...tables, socialProviders: providers };
};
