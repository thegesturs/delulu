import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingStepper } from "./onboarding-stepper";

const CONTINUE_SETUP = /continue setup/i;

const mocks = vi.hoisted(() => ({
  handleNextStep: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/hooks/use-onboarding", () => ({
  useOnboarding: () => ({
    currentStep: 2,
    handleNextStep: mocks.handleNextStep,
    handleSkipStep: vi.fn(),
    handlePreviousStep: vi.fn(),
    handleCompleteOnboarding: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("@/components/providers/api-client", () => ({
  useApiClient: () => ({
    resources: {
      connections: {
        list: () => ({ queryKey: ["connections"], effect: vi.fn() }),
      },
    },
  }),
}));

vi.mock("@/components/providers/workspace", () => ({
  useWorkspace: () => ({ workspaceId: "workspace_test" }),
}));

vi.mock("@/state/resources", () => ({
  useResourceAtom: () => ({ data: { data: [] } }),
}));

vi.mock("./welcome-step", () => ({ WelcomeStep: () => null }));
vi.mock("./pricing-step", () => ({
  PricingStep: () => <div>Pricing plans</div>,
}));
vi.mock("./connect-accounts-step", () => ({
  ConnectAccountsStep: () => null,
}));
vi.mock("./automation-setup-step", () => ({
  AutomationSetupStep: () => null,
}));
vi.mock("./survey-step", () => ({ SurveyStep: () => null }));

describe("OnboardingStepper", () => {
  beforeEach(() => {
    mocks.handleNextStep.mockReset();
  });

  it("allows an unpaid user to continue past pricing", () => {
    render(<OnboardingStepper />);

    const continueButton = screen.getByRole("button", {
      name: CONTINUE_SETUP,
    });
    expect((continueButton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(continueButton);
    expect(mocks.handleNextStep).toHaveBeenCalledOnce();
  });
});
