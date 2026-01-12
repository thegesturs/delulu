'use client';

import { useOnboarding } from '@/hooks/use-onboarding';
import { Button } from '@delulu/design-system/components/ui/button';
import { Icon } from '@delulu/design-system/providers/icon';

import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons-pro/core-solid-rounded';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { ConnectAccountsStep } from './connect-accounts-step';
import { OnboardingProgress } from './onboarding-progress';
import { PricingStep } from './pricing-step';
import { WelcomeStep } from './welcome-step';

export function OnboardingStepper() {
  const router = useRouter();
  const {
    currentStep,
    accountsConnected,
    handleNextStep,
    handleSkipStep,
    handlePreviousStep,
    handleCompleteOnboarding,
    isLoading,
  } = useOnboarding();

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 3;
  const canContinue = currentStep === 2 ? accountsConnected >= 1 : true;

  const handleContinue = async () => {
    if (isLastStep) {
      // Track final step completion before completing onboarding
      await handleNextStep();

      // Complete onboarding and redirect
      const result = await handleCompleteOnboarding();
      if (result.success) {
        router.push('/');
      }
    } else {
      await handleNextStep();
    }
  };

  const handleSkip = async () => {
    if (isLastStep) {
      const result = await handleCompleteOnboarding();
      if (result.success) {
        router.push('/');
      }
    } else {
      await handleSkipStep();
    }
  };

  const getButtonText = () => {
    if (isLastStep) {
      return 'Start Using Delulu';
    }
    if (currentStep === 2) {
      return canContinue ? 'Continue' : 'Connect at least 1 account';
    }
    return 'Get Started';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-3xl space-y-8">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={currentStep} totalSteps={3} />

        {/* Step Content */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {currentStep === 1 && <WelcomeStep />}
              {currentStep === 2 && <ConnectAccountsStep />}
              {currentStep === 3 && <PricingStep />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <motion.div
          className="flex items-center justify-between pt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div>
            {!isFirstStep && (
              <Button
                variant="ghost"
                onClick={handlePreviousStep}
                disabled={isLoading}
                className="hover:bg-muted/50"
              >
                <Icon icon={ArrowLeft01Icon} size={16} className="mr-2 " />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              {isLastStep ? "Skip, I'll do this later" : 'Skip this step'}
            </Button>

            <Button
              onClick={handleContinue}
              disabled={!canContinue || isLoading}
              size="lg"
              className="px-8"
            >
              {getButtonText()}
              {!isLastStep && <Icon icon={ArrowRight01Icon} size={16} className="ml-2 " />}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
