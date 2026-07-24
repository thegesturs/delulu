import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingStepper } from "./onboarding-stepper";

const PUBLISH_CONTENT = /publish content/i;
const CONTINUE = /^continue/i;
const PUBLISH_FIRST = /where do you want to publish first/i;
const CREATE_POST = /create your first post/i;
const CREATE_AUTO_DM = /create your first auto-dm/i;
const LOG_OUT = /log out/i;

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signOut: vi.fn(),
  toastError: vi.fn(),
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

vi.mock("@delulu/auth", () => ({
  useClerk: () => ({ signOut: mocks.signOut }),
}));

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError },
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

afterEach(cleanup);

describe("OnboardingStepper", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    mocks.signOut.mockReset();
    mocks.signOut.mockResolvedValue(undefined);
    mocks.toastError.mockReset();
    mocks.updateSetup.mockReset();
    mocks.updateSetup.mockResolvedValue({ updated: true });
    mocks.completeSetup.mockReset();
    mocks.completeSetup.mockResolvedValue({ completed: true });
    mocks.setupData.goal = null;
    mocks.setupData.webStep = "goal";
    mocks.accountsData = [];
  });

  it("lets the user sign out from every onboarding step", async () => {
    let view = render(<OnboardingStepper />);

    fireEvent.click(screen.getByRole("button", { name: LOG_OUT }));

    await waitFor(() =>
      expect(mocks.signOut).toHaveBeenCalledWith({ redirectUrl: "/sign-in" })
    );
    view.unmount();

    mocks.setupData.goal = "publish";
    mocks.setupData.webStep = "connect";
    view = render(<OnboardingStepper />);
    fireEvent.click(screen.getByRole("button", { name: LOG_OUT }));
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(2));
    view.unmount();

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
    fireEvent.click(screen.getByRole("button", { name: LOG_OUT }));
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(3));
  });

  it("recovers when logout fails", async () => {
    mocks.signOut.mockRejectedValueOnce(
      new Error("Session service unavailable")
    );
    render(<OnboardingStepper />);

    fireEvent.click(screen.getByRole("button", { name: LOG_OUT }));

    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: LOG_OUT }) as HTMLButtonElement)
          .disabled
      ).toBe(false)
    );
    expect(mocks.toastError).toHaveBeenCalledWith("Could not log out", {
      description: "Session service unavailable",
    });
  });

  it("blocks onboarding interactions while logout is pending", async () => {
    let finishSignOut: (() => void) | undefined;
    mocks.signOut.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishSignOut = resolve;
        })
    );
    render(<OnboardingStepper />);

    fireEvent.click(screen.getByRole("button", { name: LOG_OUT }));

    await waitFor(() => {
      const logout = screen.getByRole("button", {
        name: LOG_OUT,
      }) as HTMLButtonElement;
      expect(logout.disabled).toBe(true);
      expect(
        screen
          .getByRole("region", { name: "Onboarding step" })
          .hasAttribute("inert")
      ).toBe(true);
    });

    finishSignOut?.();
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
