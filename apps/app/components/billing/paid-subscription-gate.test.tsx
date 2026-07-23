import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaidSubscriptionGate } from "./paid-subscription-gate";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  subscription: {
    isPaid: false,
    isLifetime: false,
    isLoading: false,
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@delulu/auth", () => ({
  useUser: () => ({
    user: { publicMetadata: { onboardingComplete: true } },
  }),
}));

vi.mock("@/hooks/use-subscription", () => ({
  useSubscription: () => mocks.subscription,
}));

describe("PaidSubscriptionGate", () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.subscription.isPaid = false;
  });

  it("sends an unpaid user to billing after onboarding", async () => {
    render(<PaidSubscriptionGate />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/billing");
    });
  });

  it("allows a paid user into the application", async () => {
    mocks.subscription.isPaid = true;
    render(<PaidSubscriptionGate />);

    await waitFor(() => {
      expect(mocks.replace).not.toHaveBeenCalled();
    });
  });
});
