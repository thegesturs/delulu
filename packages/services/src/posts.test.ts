import { describe, expect, it } from "vitest";
import { decodePostContentForView } from "./posts";

describe("decodePostContentForView", () => {
  it("keeps pre-validation drafts with legacy-length group ids readable", () => {
    const content = decodePostContentForView({
      groups: [
        {
          id: "post_group_V2StGXR8_Z5jdHi6B-myW",
          isDefault: true,
          segments: [{ text: "Recovered draft", media: [] }],
        },
      ],
    });

    expect(content.groups[0]?.id).toBe("post_group_V2StGXR8_Z5jdHi6B-myW");
  });
});
