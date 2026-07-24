import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingStepper } from "./onboarding-stepper";

const PUBLISH_CONTENT = /publish content/i;
const CONTINUE = /^continue/i;
const PUBLISH_FIRST = /where do you want to publish first/i;
const CREATE_POST = /create your first post/i;
const CREATE_AUTO_DM = /create your first auto-dm/i;

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  updateSetup: vi.fn(),
  completeSetup: vi.fn(),
  setupData: {
    goal: null as "publish" | "auto_dm" | null,
    webStep: "goal",
  },
  accountsData: [] as Array<{
    id: string;
    platform: string;
    profileId: string;
    username: string | null;
    displayName: string | null;
    expiresAt: string | null;
  }>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/providers/api-client", () => ({
  useApiClient: () => ({
    resources: {
      me: {
        setup: () => ({ queryKey: ["setup"], effect: vi.fn() }),
        updateSetup: () => ({
          mutationKey: ["updateSetup"],
          effect: vi.fn(),
        }),
        completeSetup: () => ({
          mutationKey: ["completeSetup"],
          effect: vi.fn(),
        }),
      },
      connections: {
        confirmTransfer: () => ({
          mutationKey: ["confirmTransfer"],
          effect: vi.fn(),
        }),
        list: () => ({ queryKey: ["connections"], effect: vi.fn() }),
        mint: () => ({ mutationKey: ["mint"], effect: vi.fn() }),
        remove: () => ({ mutationKey: ["remove"], effect: vi.fn() }),
      },
    },
  }),
}));

vi.mock("@/components/providers/workspace", () => ({
  useWorkspace: () => ({ workspaceId: "workspace_test" }),
}));

vi.mock("@/hooks/use-usage-limits", () => ({
  useUsageLimit: () => ({
    allowed: true,
    limit: 5,
    planType: "echo",
  }),
}));

vi.mock("@/hooks/use-feature-flag", () => ({
  useFeatureFlag: () => true,
}));

vi.mock("@/state/resources", () => ({
  useResourceAtom: (options: { queryKey: string[] }) =>
    options.queryKey[0] === "setup"
      ? {
          data: mocks.setupData,
          refetch: vi.fn().mockResolvedValue({ data: mocks.setupData }),
        }
      : {
          data: { data: mocks.accountsData, total: mocks.accountsData.length },
          refetch: vi
            .fn()
            .mockResolvedValue({ data: { data: mocks.accountsData } }),
        },
  useMutationAtom: (options: { mutationKey: string[] }) => {
    const key = options.mutationKey[0];
    return {
      isPending: false,
      mutateAsync:
        key === "updateSetup"
          ? mocks.updateSetup
          : key === "completeSetup"
            ? mocks.completeSetup
            : vi.fn(),
    };
  },
}));

describe("OnboardingStepper", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    mocks.updateSetup.mockReset();
    mocks.updateSetup.mockResolvedValue({ updated: true });
    mocks.completeSetup.mockReset();
    mocks.completeSetup.mockResolvedValue({ completed: true });
    mocks.setupData.goal = null;
    mocks.setupData.webStep = "goal";
    mocks.accountsData = [];
  });

  it("saves the selected activation goal and advances to connections", async () => {
    render(<OnboardingStepper />);

    fireEvent.click(screen.getByRole("radio", { name: PUBLISH_CONTENT }));

    await waitFor(() =>
      expect(mocks.updateSetup).toHaveBeenCalledWith({ goal: "publish" })
    );
    fireEvent.click(screen.getByRole("button", { name: CONTINUE }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: PUBLISH_FIRST,
        })
      ).toBeTruthy()
    );
  });

  it("accepts a non-Instagram publishing account and opens the composer", async () => {
    mocks.setupData.goal = "publish";
    mocks.setupData.webStep = "ready";
    mocks.accountsData = [
      {
        id: "connection_threads",
        platform: "THREADS",
        profileId: "profile_threads",
        username: "creator",
        displayName: "Creator",
        expiresAt: null,
      },
    ];

    render(<OnboardingStepper />);
    fireEvent.click(screen.getByRole("button", { name: CREATE_POST }));

    await waitFor(() => expect(mocks.completeSetup).toHaveBeenCalledOnce());
    expect(mocks.push).toHaveBeenCalledWith("/post");
  });

  it("requires Instagram for auto-DM and opens the starter automation", async () => {
    mocks.setupData.goal = "auto_dm";
    mocks.setupData.webStep = "ready";
    mocks.accountsData = [
      {
        id: "connection_instagram",
        platform: "INSTAGRAM",
        profileId: "profile_instagram",
        username: "creator",
        displayName: "Creator",
        expiresAt: null,
      },
    ];

    render(<OnboardingStepper />);
    fireEvent.click(screen.getByRole("button", { name: CREATE_AUTO_DM }));

    await waitFor(() => expect(mocks.completeSetup).toHaveBeenCalledOnce());
    expect(mocks.push).toHaveBeenCalledWith(
      "/automations/new?template=lead-magnet"
    );
  });
});
