import { describe, expect, it } from "vitest";
import { instagramDmRecipient } from "./automation-providers";

describe("Instagram automation recipients", () => {
  it("uses the triggering comment for a first private reply", () => {
    expect(
      instagramDmRecipient({
        recipientId: "instagram_user_1",
        recipientCommentId: "comment_1",
      })
    ).toEqual({ comment_id: "comment_1" });
  });

  it("uses the Instagram-scoped user for an existing conversation", () => {
    expect(instagramDmRecipient({ recipientId: "instagram_user_1" })).toEqual({
      id: "instagram_user_1",
    });
  });
});
