import { Config, Context, Effect, Layer, Redacted, Schema } from "effect";

export const CipherVersion = Schema.Literal("v1");
export type CipherVersion = typeof CipherVersion.Type;

export class TokenCipherError extends Schema.TaggedErrorClass<TokenCipherError>()(
  "TokenCipherError",
  {
    operation: Schema.Literals(["encrypt", "decrypt"]),
    message: Schema.String,
    retryable: Schema.Boolean,
  }
) {}

export interface EncryptedToken {
  readonly ciphertext: string;
  readonly cipherVersion: CipherVersion;
}

const encodeBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

const decodeBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const deriveKey = (secret: string, salt: Uint8Array): Promise<CryptoKey> =>
  crypto.subtle
    .importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, [
      "deriveKey",
    ])
    .then((material) =>
      crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
        material,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      )
    );

export const makeTokenCipher = (secret: string): TokenCipher["Service"] => ({
  encrypt: Effect.fn("TokenCipher.encrypt")((plaintext: string) =>
    Effect.tryPromise({
      try: async () => {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(secret, salt);
        const encrypted = new Uint8Array(
          await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            new TextEncoder().encode(plaintext)
          )
        );
        const combined = new Uint8Array(
          salt.length + iv.length + encrypted.length
        );
        combined.set(salt);
        combined.set(iv, salt.length);
        combined.set(encrypted, salt.length + iv.length);
        return {
          ciphertext: encodeBase64(combined),
          cipherVersion: "v1" as const,
        };
      },
      catch: (cause) =>
        new TokenCipherError({
          operation: "encrypt",
          message: String(cause),
          retryable: false,
        }),
    })
  ),
  decrypt: Effect.fn("TokenCipher.decrypt")(
    ({ ciphertext, cipherVersion }: EncryptedToken) =>
      cipherVersion === "v1"
        ? Effect.tryPromise({
            try: async () => {
              const combined = decodeBase64(ciphertext);
              if (combined.length < 45) {
                throw new Error("Ciphertext is too short");
              }
              const salt = combined.slice(0, 16);
              const iv = combined.slice(16, 28);
              const encrypted = combined.slice(28);
              const key = await deriveKey(secret, salt);
              const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv },
                key,
                encrypted
              );
              return new TextDecoder().decode(decrypted);
            },
            catch: (cause) =>
              new TokenCipherError({
                operation: "decrypt",
                message: String(cause),
                retryable: false,
              }),
          })
        : Effect.fail(
            new TokenCipherError({
              operation: "decrypt",
              message: `Unsupported cipher version: ${cipherVersion}`,
              retryable: false,
            })
          )
  ),
});

export class TokenCipher extends Context.Service<
  TokenCipher,
  {
    readonly encrypt: (
      plaintext: string
    ) => Effect.Effect<EncryptedToken, TokenCipherError>;
    readonly decrypt: (
      token: EncryptedToken
    ) => Effect.Effect<string, TokenCipherError>;
  }
>()("@delulu/core/TokenCipher") {
  static readonly layer = Layer.effect(
    TokenCipher,
    Config.redacted("ENCRYPTION_SECRET").pipe(
      Effect.map((secret) =>
        TokenCipher.of(makeTokenCipher(Redacted.value(secret)))
      )
    )
  );
}
