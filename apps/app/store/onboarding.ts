import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Define the store's state types
interface OnboardingState {
  currentStep: number; // 1, 2, 3, or 4
  accountsConnected: number; // Real-time count for Step 2
  surveyAnswer: string | null;
}

// Define the store's actions
interface OnboardingActions {
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  setAccountsConnected: (count: number) => void;
  setSurveyAnswer: (answer: string | null) => void;
  reset: () => void;
}

const initialState: OnboardingState = {
  currentStep: 1,
  accountsConnected: 0,
  surveyAnswer: null,
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
            currentStep: Math.min(state.currentStep + 1, 4),
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
          (state) => {
            if (state.accountsConnected === count) return state;
            return { accountsConnected: count };
          },
          false,
          "onboarding/setAccountsConnected"
        ),

      setSurveyAnswer: (answer: string | null) =>
        set({ surveyAnswer: answer }, false, "onboarding/setSurveyAnswer"),

      reset: () => set(initialState, false, "onboarding/reset"),
    }),
    { name: "onboarding-store" }
  )
);
