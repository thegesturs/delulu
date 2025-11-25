export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      onboardingComplete?: boolean
      currentStep?: number
      stepsCompleted?: string[]
      skippedSteps?: string[]
      tourCompleted?: boolean
      tourDismissed?: boolean
    }
  }
}
