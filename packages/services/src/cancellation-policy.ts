export const CANCELLATION_RECOVERY_DAYS = 60;
export const CANCELLATION_CONFIRMATION = "CANCEL AND DELETE";

export const CANCELLATION_REASONS = [
  "too_expensive",
  "missing_features",
  "switched_service",
  "unused",
  "customer_service",
  "low_quality",
  "too_complex",
  "other",
] as const;

export type CancellationReason = (typeof CANCELLATION_REASONS)[number];

export const isCancellationReason = (
  value: string
): value is CancellationReason =>
  CANCELLATION_REASONS.some((candidate) => candidate === value);

export const cancellationDeletionAt = (termEnd: Date): Date =>
  new Date(
    termEnd.getTime() + CANCELLATION_RECOVERY_DAYS * 24 * 60 * 60 * 1000
  );

export const canOfferMonthlySave = (input: {
  readonly billingPeriod: unknown;
  readonly currentPeriodStart: Date | null;
  readonly saveAlreadyUsed: boolean;
  readonly now?: Date;
}): boolean => {
  if (input.billingPeriod !== "MONTHLY" || input.saveAlreadyUsed) {
    return false;
  }
  if (input.currentPeriodStart === null) {
    return false;
  }
  const now = input.now ?? new Date();
  return now.getTime() - input.currentPeriodStart.getTime() >= 30 * 86_400_000;
};
