import {
  completeOnboarding,
  completeTour,
  updateOnboardingStep,
} from '@/app/onboarding/_actions';
import { useOnboardingStore } from '@/store/onboarding';
import { posthog } from '@delulu/analytics/posthog/client';
import { useUser } from '@delulu/auth';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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

  // CRITICAL FIX: Hydrate Zustand store from Clerk metadata on mount
  // This ensures page refreshes don't lose progress
  useEffect(() => {
    if (metadata?.currentStep && currentStep !== metadata.currentStep) {
      setCurrentStep(metadata.currentStep);
    }
  }, [metadata?.currentStep, currentStep, setCurrentStep]);

  // Move to next step
  const handleNextStep = async () => {
    const stepName = getStepName(currentStep);
    setIsLoading(true);

    try {
      // Track step completion
      posthog.capture('onboarding_step_completed', {
        step: currentStep,
        stepName,
        accountsConnected,
      });

      // CRITICAL FIX: Prevent duplicate steps using Set
      const newStepsCompleted = Array.from(
        new Set([...stepsCompleted, stepName])
      );

      // CRITICAL FIX: Update server first, validate response before UI update
      const result = await updateOnboardingStep({
        currentStep: currentStep + 1,
        stepsCompleted: newStepsCompleted,
        skippedSteps,
      });

      if (result.success) {
        // Reload user data to get fresh metadata
        await user?.reload();
        // Move to next step in UI only after server success
        nextStep();
      } else {
        // Show error if server update failed
        toast.error(
          result.error || 'Failed to save progress. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error in handleNextStep:', error);
      toast.error('Failed to save progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Skip current step
  const handleSkipStep = async () => {
    const stepName = getStepName(currentStep);
    setIsLoading(true);

    try {
      // Track skip event
      posthog.capture('onboarding_step_skipped', {
        step: currentStep,
        stepName,
      });

      // CRITICAL FIX: Prevent duplicate skipped steps using Set
      const newSkippedSteps = Array.from(new Set([...skippedSteps, stepName]));

      // CRITICAL FIX: Validate server response before UI update
      const result = await updateOnboardingStep({
        currentStep: currentStep + 1,
        stepsCompleted,
        skippedSteps: newSkippedSteps,
      });

      if (result.success) {
        await user?.reload();
        nextStep();
      } else {
        toast.error(
          result.error || 'Failed to save progress. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error in handleSkipStep:', error);
      toast.error('Failed to save progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Go back to previous step
  const handlePreviousStep = async () => {
    // CRITICAL FIX: Sync back button with server
    // This prevents page refresh from jumping forward
    if (currentStep > 1) {
      setIsLoading(true);

      try {
        const newStep = currentStep - 1;

        const result = await updateOnboardingStep({
          currentStep: newStep,
          stepsCompleted, // Keep existing completed steps
          skippedSteps,
        });

        if (result.success) {
          await user?.reload();
          previousStep();
        } else {
          toast.error(result.error || 'Failed to update progress.');
        }
      } catch (error) {
        console.error('Error in handlePreviousStep:', error);
        toast.error('Failed to update progress.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Complete onboarding
  const handleCompleteOnboarding = async () => {
    setIsLoading(true);

    try {
      // Track the final step completion
      const currentStepName = getStepName(currentStep);
      posthog.capture('onboarding_step_completed', {
        step: currentStep,
        stepName: currentStepName,
        accountsConnected,
      });

      // Track overall completion
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
        toast.success('Welcome to Delulu Social! 🎉');
        return { success: true };
      }

      // Show error if completion failed
      toast.error(
        result.error || 'Failed to complete onboarding. Please try again.'
      );
      return { error: result.error };
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding. Please try again.');
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
