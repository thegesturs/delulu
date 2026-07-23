// @vitest-environment node

import { type ApiClient, resourceEffect } from "@delulu/client";
import { Effect } from "effect";
import { renderToReadableStream } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AppStateProvider,
  ResourceBoundary,
  useResourceAtom,
} from "./resources";

describe("AppStateProvider SSR", () => {
  it("renders without browser globals", async () => {
    const client = {} as ApiClient;
    const errors: unknown[] = [];
    const descriptor = resourceEffect({
      queryKey: ["ssr", "probe"] as const,
      effect: () => Effect.succeed("ready"),
    });
    const Probe = () => <div>{useResourceAtom(descriptor).data}</div>;

    const stream = await renderToReadableStream(
      <AppStateProvider client={client}>
        <ResourceBoundary fallback={<div>loading</div>}>
          <Probe />
        </ResourceBoundary>
      </AppStateProvider>,
      {
        onError: (error) => {
          errors.push(error);
        },
      }
    );
    const html = await new Response(stream).text();

    expect(errors).toEqual([]);
    expect(html).toContain("ready");
  });
});
