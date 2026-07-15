import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "./post";

const values = new Map<string, string>();
const storage: Storage = {
  get length() {
    return values.size;
  },
  clear: () => values.clear(),
  getItem: (key) => values.get(key) ?? null,
  key: (index) => [...values.keys()][index] ?? null,
  removeItem: (key) => values.delete(key),
  setItem: (key, value) => values.set(key, value),
};

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: storage,
});

describe("post draft persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.getState().reset();
  });

  it("migrates a legacy draft and resets transient upload state", async () => {
    const scheduledTime = "2026-07-15T08:30:00.000Z";
    const state = useStore.getState();
    localStorage.setItem(
      "post-storage",
      JSON.stringify({
        version: 0,
        state: {
          ...state,
          date: scheduledTime,
          post: { ...state.post, scheduledTime },
          isMediaUploading: true,
        },
      })
    );

    await useStore.persist.rehydrate();

    const restored = useStore.getState();
    expect(restored.date).toBeInstanceOf(Date);
    expect(restored.post.scheduledTime).toBeInstanceOf(Date);
    expect(restored.isMediaUploading).toBe(false);
    expect(
      JSON.parse(localStorage.getItem("post-storage") ?? "{}").version
    ).toBe(1);
  });

  it("falls back to a clean draft for malformed storage", async () => {
    localStorage.setItem("post-storage", "not-json");
    await useStore.persist.rehydrate();
    expect(useStore.getState().post.content[0]?.text).toBe("");
    expect(useStore.getState().isMediaUploading).toBe(false);
  });

  it("discards incompatible nested editor data and invalid dates", async () => {
    localStorage.setItem(
      "post-storage",
      JSON.stringify({
        version: 1,
        draft: {
          date: "not-a-date",
          post: { content: "invalid", alternativeContent: [] },
        },
      })
    );

    await useStore.persist.rehydrate();

    expect(useStore.getState().date).toBeUndefined();
    expect(useStore.getState().post.content[0]?.text).toBe("");
  });
});
