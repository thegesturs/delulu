"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useApiClient } from "@/components/providers/api-client";
import { useWorkspace } from "@/components/providers/workspace";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useSubscription } from "@/hooks/use-subscription";
import { useResourceAtom } from "@/state/resources";
import { AutomationSetupStep } from "./automation-setup-step";
import { ConnectAccountsStep } from "./connect-accounts-step";
import { OnboardingProgress } from "./onboarding-progress";
import { PricingStep } from "./pricing-step";
import { SurveyStep } from "./survey-step";
import { WelcomeStep } from "./welcome-step";

export function OnboardingStepper() {
  const router = useRouter();
  const {
    currentStep,
    handleNextStep,
    handleSkipStep,
    handlePreviousStep,
    handleCompleteOnboarding,
    isLoading,
  } = useOnboarding();
  const { isPaid, isLifetime, isLoading: subLoading } = useSubscription();
  const { workspaceId } = useWorkspace();
  const { resources } = useApiClient();
  const accounts = useResourceAtom({
    ...resources.connections.list(workspaceId ?? "", { limit: 100 }),
    enabled: Boolean(workspaceId),
  });

  const hasInstagram = accounts.data?.data.some(
    (a) => a.platform === "INSTAGRAM"
  );
  const hasPaidPlan = isPaid || isLifetime;

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 5;
  const isPricingStep = currentStep === 2;

  const canContinue = (() => {
    if (currentStep === 3) {
      return !!hasInstagram;
    }
    if (isPricingStep) {
      return hasPaidPlan && !subLoading;
    }
    return true;
  })();

  const handleContinue = async () => {
    if (isLastStep) {
      if (!hasPaidPlan) {
        return;
      }
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
      return;
    }
    await handleSkipStep();
  };

  const getButtonText = () => {
    if (isLastStep) {
      return hasPaidPlan ? "Start Using Delulu" : "Choose a plan above";
    }
    if (currentStep === 3) {
      return hasInstagram ? "Continue" : "Connect Instagram to continue";
    }
    if (currentStep === 4) {
      return "Continue";
    }
    return "Get Started";
  };

  const showSkip = !(isPricingStep || isLastStep);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-3xl space-y-8">
        <OnboardingProgress currentStep={currentStep} totalSteps={5} />

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
              {currentStep === 2 && <PricingStep />}
              {currentStep === 3 && <ConnectAccountsStep />}
              {currentStep === 4 && <AutomationSetupStep />}
              {currentStep === 5 && <SurveyStep />}
            </motion.div>
          </AnimatePresence>
        </div>

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
            {showSkip && (
              <Button
                className="text-muted-foreground hover:text-foreground"
                disabled={isLoading}
                onClick={handleSkip}
                variant="ghost"
              >
                Skip this step
              </Button>
            )}

            <Button
              className="px-8"
              disabled={!canContinue || isLoading || subLoading}
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
