"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Loading03Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/hooks/use-onboarding";
import { ConnectAccountsStep } from "./connect-accounts-step";
import { OnboardingProgress } from "./onboarding-progress";
import { PricingStep } from "./pricing-step";
import { WelcomeStep } from "./welcome-step";

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
      // On last step, complete onboarding directly without advancing
      // (there's no step 4, so we don't call handleNextStep)
      const result = await handleCompleteOnboarding();
      if (result.success) {
        router.push("/");
      }
    } else {
      await handleNextStep();
    }
  };

  const handleSkip = async () => {
    if (isLastStep) {
      const result = await handleCompleteOnboarding();
      if (result.success) {
        router.push("/");
      }
    } else {
      await handleSkipStep();
    }
  };

  const getButtonText = () => {
    if (isLastStep) {
      return "Start Using Delulu";
    }
    if (currentStep === 2) {
      return canContinue ? "Continue" : "Connect at least 1 account";
    }
    return "Get Started";
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
              animate={{ opacity: 1, x: 0 }}
              className="w-full"
              exit={{ opacity: 0, x: -10 }}
              initial={{ opacity: 0, x: 10 }}
              key={currentStep}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 1 && <WelcomeStep />}
              {currentStep === 2 && <ConnectAccountsStep />}
              {currentStep === 3 && <PricingStep />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <motion.div
          animate={{ opacity: 1 }}
          className="flex items-center justify-between pt-6"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div>
            {!isFirstStep && (
              <Button
                className="hover:bg-muted/50"
                disabled={isLoading}
                onClick={handlePreviousStep}
                variant="ghost"
              >
                <Icon className="mr-2" icon={ArrowLeft01Icon} size={16} />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              className="text-muted-foreground hover:text-foreground"
              disabled={isLoading}
              onClick={handleSkip}
              variant="ghost"
            >
              {isLastStep ? "Skip, I'll do this later" : "Skip this step"}
            </Button>

            <Button
              className="px-8"
              disabled={!canContinue || isLoading}
              onClick={handleContinue}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Icon
                    className="mr-2 animate-spin"
                    icon={Loading03Icon}
                    size={16}
                  />
                  Saving...
                </>
              ) : (
                <>
                  {getButtonText()}
                  {!isLastStep && (
                    <Icon className="ml-2" icon={ArrowRight01Icon} size={16} />
                  )}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
