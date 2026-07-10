import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { PostContent } from "../domain/post-group";
import { PlatformSettings } from "../domain/post-target";
import { makeId, UserId } from "./ids";
import { validateMediaFile } from "./media";
import { makeTokenCipher } from "./token-cipher";

describe("core kernel", () => {
  it("generates branded UUIDv7 identifiers", () => {
    const id = makeId(UserId);
    expect(Schema.is(UserId)(id)).toBe(true);
    expect(id[14]).toBe("7");
  });

  it("reports every violated media constraint", () => {
    const result = validateMediaFile(
      {
        mediaType: "video",
        mimeType: "video/mp4",
        sizeBytes: 11,
        width: 100,
        durationSeconds: 61,
      },
      {
        allowedTypes: ["image"],
        maxSizeBytes: 10,
        minWidth: 200,
        maxDurationSeconds: 60,
      }
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(4);
  });

  it("round-trips the legacy v1 token byte format", async () => {
    const cipher = makeTokenCipher("a stable test secret");
    const encrypted = await Effect.runPromise(cipher.encrypt("token-value"));
    expect(encrypted.cipherVersion).toBe("v1");
    expect(Buffer.from(encrypted.ciphertext, "base64")).toHaveLength(55);
    await expect(Effect.runPromise(cipher.decrypt(encrypted))).resolves.toBe(
      "token-value"
    );
    await expect(
      Effect.runPromise(
        cipher.decrypt({
          ciphertext:
            "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaG+yU8Pe8wlxf9FyM0c1Ba98ZtK5RuNlEDGFPf1w=",
          cipherVersion: "v1",
        })
      )
    ).resolves.toBe("legacy-token");
  });

  it("rejects post content without exactly one default group", () => {
    expect(Schema.is(PostContent)({ groups: [] })).toBe(false);
  });

  it("rejects settings that do not match their platform", () => {
    expect(
      Schema.is(PlatformSettings)({
        platform: "INSTAGRAM",
        values: { replyRestriction: "everyone" },
      })
    ).toBe(false);
  });
});
