import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Define the store's state types
interface OnboardingState {
  currentStep: number; // 1, 2, or 3
  accountsConnected: number; // Real-time count for Step 2
}

// Define the store's actions
interface OnboardingActions {
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  setAccountsConnected: (count: number) => void;
  reset: () => void;
}

const initialState: OnboardingState = {
  currentStep: 1,
  accountsConnected: 0,
};

// Create the Zustand store
export const useOnboardingStore = create<OnboardingState & OnboardingActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setCurrentStep: (step: number) =>
        set({ currentStep: step }, false, "onboarding/setCurrentStep"),

      nextStep: () =>
        set(
          (state) => ({
            currentStep: Math.min(state.currentStep + 1, 3),
          }),
          false,
          "onboarding/nextStep"
        ),

      previousStep: () =>
        set(
          (state) => ({
            currentStep: Math.max(state.currentStep - 1, 1),
          }),
          false,
          "onboarding/previousStep"
        ),

      setAccountsConnected: (count: number) =>
        set(
          { accountsConnected: count },
          false,
          "onboarding/setAccountsConnected"
        ),

      reset: () => set(initialState, false, "onboarding/reset"),
    }),
    { name: "onboarding-store" }
  )
);
