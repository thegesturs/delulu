import { describe, expect, it } from "vitest";
import {
  decodeAutomationPatch,
  decodeAutomationWrite,
} from "./automation-write";

const write = {
  connectionId: "connection_123456789012",
  name: "Guide replies",
  triggers: [
    {
      id: "trigger-1",
      type: "trigger",
      triggerType: "comment",
      targetMode: "all",
      targetPostIds: [],
    },
  ],
  steps: [
    {
      id: "step-1",
      type: "send_dm",
      messageTemplate: "Here is the guide",
    },
  ],
};

describe("automation file contracts", () => {
  it("validates write and patch JSON with the public contract", () => {
    expect(decodeAutomationWrite(write)).toMatchObject({
      name: "Guide replies",
    });
    expect(decodeAutomationPatch({ enabled: false })).toEqual({
      enabled: false,
    });
  });

  it("rejects legacy files without explicit targeting", () => {
    expect(() =>
      decodeAutomationWrite({
        ...write,
        triggers: [{ ...write.triggers[0], targetMode: undefined }],
      })
    ).toThrow();
  });
});
