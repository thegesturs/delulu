import {
  completeOnboarding,
  completeTour,
  updateOnboardingStep,
} from '@/app/onboarding/_actions';
import { useOnboardingStore } from '@/store/onboarding';
import { posthog } from '@delulu/analytics/posthog/client';
import { useUser } from '@delulu/auth';
import { useState } from 'react';

export function useOnboarding() {
  const { user } = useUser();
  const {
    currentStep,
    setCurrentStep,
    nextStep,
    previousStep,
    accountsConnected,
  } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);

  // Get onboarding metadata from Clerk user
  const metadata = user?.publicMetadata as {
    onboardingComplete?: boolean;
    currentStep?: number;
    stepsCompleted?: string[];
    skippedSteps?: string[];
    tourCompleted?: boolean;
    tourDismissed?: boolean;
  };

  const stepsCompleted = metadata?.stepsCompleted || [];
  const skippedSteps = metadata?.skippedSteps || [];

  // Move to next step
  const handleNextStep = async () => {
    const stepName = getStepName(currentStep);

    // Track step completion
    posthog.capture('onboarding_step_completed', {
      step: currentStep,
      stepName,
      accountsConnected,
    });

    // Update Clerk metadata
    const newStepsCompleted = [...stepsCompleted, stepName];
    await updateOnboardingStep({
      currentStep: currentStep + 1,
      stepsCompleted: newStepsCompleted,
      skippedSteps,
    });

    // Move to next step in UI
    nextStep();
  };

  // Skip current step
  const handleSkipStep = async () => {
    const stepName = getStepName(currentStep);

    // Track skip event
    posthog.capture('onboarding_step_skipped', {
      step: currentStep,
      stepName,
    });

    // Update Clerk metadata
    const newSkippedSteps = [...skippedSteps, stepName];
    await updateOnboardingStep({
      currentStep: currentStep + 1,
      stepsCompleted,
      skippedSteps: newSkippedSteps,
    });

    // Move to next step in UI
    nextStep();
  };

  // Go back to previous step
  const handlePreviousStep = () => {
    previousStep();
  };

  // Complete onboarding
  const handleCompleteOnboarding = async () => {
    setIsLoading(true);

    try {
      // Track completion
      posthog.capture('onboarding_completed', {
        stepsSkipped: skippedSteps,
        duration:
          Date.now() -
          (user?.createdAt ? new Date(user.createdAt).getTime() : Date.now()),
      });

      // Update user properties
      posthog.people?.set({
        onboarding_completed: true,
        onboarding_completion_date: new Date().toISOString(),
      });

      // Mark onboarding complete in Clerk
      const result = await completeOnboarding();

      if (result.success) {
        // Reload user data to get updated metadata
        await user?.reload();
        return { success: true };
      }

      return { error: result.error };
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return { error: 'Failed to complete onboarding' };
    } finally {
      setIsLoading(false);
    }
  };

  // Complete or dismiss tour
  const handleCompleteTour = async (dismissed = false) => {
    const eventName = dismissed
      ? 'onboarding_tour_dismissed'
      : 'onboarding_tour_completed';

    posthog.capture(eventName, {
      lastStep: currentStep,
    });

    if (!dismissed) {
      posthog.people?.set({
        tour_completed: true,
      });
    }

    await completeTour(dismissed);
    await user?.reload();
  };

  return {
    // State
    currentStep,
    accountsConnected,
    stepsCompleted,
    skippedSteps,
    isLoading,
    metadata,

    // Actions
    setCurrentStep,
    handleNextStep,
    handleSkipStep,
    handlePreviousStep,
    handleCompleteOnboarding,
    handleCompleteTour,
  };
}

// Helper function to get step name
function getStepName(step: number): string {
  const stepNames = {
    1: 'welcome',
    2: 'connect',
    3: 'pricing',
  };
  return stepNames[step as keyof typeof stepNames] || 'unknown';
}
