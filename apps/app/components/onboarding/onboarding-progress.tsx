import { cn } from '@delulu/design-system/lib/utils';
import { motion } from 'motion/react';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({
  currentStep,
  totalSteps = 3,
}: OnboardingProgressProps) {
  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <motion.div
            key={step}
            initial={false}
            animate={{
              scale: isActive ? 1.2 : 1,
              opacity: isActive || isCompleted ? 1 : 0.3,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
            }}
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              isActive || isCompleted ? 'bg-primary' : 'bg-foreground'
            )}
            aria-label={`Step ${step} of ${totalSteps}`}
            aria-current={isActive ? 'step' : undefined}
          />
        );
      })}
    </div>
  );
}
