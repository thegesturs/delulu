import { describe, expect, it } from "vitest";
import {
  instagramDmMessage,
  instagramDmRecipient,
  metaProviderErrorMessage,
} from "./automation-providers";

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

  it("sends saved URL buttons as tappable Meta buttons", () => {
    expect(
      instagramDmMessage({
        message: "Here is your guide",
        buttons: [
          {
            type: "url",
            title: "Open guide",
            url: "https://example.com/guide",
          },
        ],
      })
    ).toEqual({
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Here is your guide",
          buttons: [
            {
              type: "web_url",
              title: "Open guide",
              url: "https://example.com/guide",
            },
          ],
        },
      },
    });
  });

  it("retains actionable provider codes without logging response payloads", () => {
    expect(
      metaProviderErrorMessage("DM", 400, {
        error: {
          message: "Permission is missing",
          code: 10,
          error_subcode: 2_018_065,
          access_token: "must-not-be-included",
        },
      })
    ).toBe(
      "DM provider returned 400 code=10 subcode=2018065: Permission is missing"
    );
  });
});
