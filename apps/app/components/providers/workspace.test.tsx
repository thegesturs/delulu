import { resourceEffect } from "@delulu/client";
import { render, screen, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider } from "@/state/resources";
import { useApiClient } from "./api-client";
import { useWorkspace, WorkspaceProvider } from "./workspace";

vi.mock("./api-client", () => ({
  useApiClient: vi.fn(),
}));

const validWorkspace = {
  workspaceId: "workspace_valid",
  name: "Personal",
  slug: null,
  isPersonal: true,
  role: "owner" as const,
};

describe("WorkspaceProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useApiClient).mockReturnValue({
      client: {} as ReturnType<typeof useApiClient>["client"],
      resources: {
        me: {
          workspaces: () =>
            resourceEffect({
              queryKey: ["me", "workspaces"] as const,
              effect: () => Effect.succeed({ data: [validWorkspace] }),
            }),
        },
      } as unknown as ReturnType<typeof useApiClient>["resources"],
    });
  });

  it("never exposes a persisted workspace before membership validation", async () => {
    localStorage.setItem("delulu.workspaceId", "workspace_stale");
    const seen: Array<string | null> = [];
    const Probe = () => {
      const { workspaceId } = useWorkspace();
      seen.push(workspaceId);
      return <div>{workspaceId ?? "none"}</div>;
    };

    render(
      <AppStateProvider>
        <WorkspaceProvider>
          <Probe />
        </WorkspaceProvider>
      </AppStateProvider>
    );

    await waitFor(() =>
      expect(screen.getByText(validWorkspace.workspaceId)).toBeTruthy()
    );
    expect(seen).not.toContain("workspace_stale");
  });
});
