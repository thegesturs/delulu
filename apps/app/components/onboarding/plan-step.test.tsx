import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanStep } from "./plan-step";

const PAYMENT_SYNCING = /payment confirmed, syncing/i;
const START_CHECKOUT = /start checkout/i;
const ACCOUNT_LIMIT_REACHED = /account limit is reached/i;

vi.mock("@/components/billing/pricing-cards", () => ({
  PricingCards: () => <button type="button">Start checkout</button>,
}));

afterEach(cleanup);

describe("PlanStep", () => {
  it("hides checkout while a successful payment is syncing", () => {
    render(
      <PlanStep
        isRefreshing
        onDashboard={vi.fn()}
        onRefresh={vi.fn()}
        paid={false}
        plan="free"
        refreshError={null}
      />
    );

    expect(screen.getByText(PAYMENT_SYNCING)).toBeTruthy();
    expect(screen.queryByRole("button", { name: START_CHECKOUT })).toBeNull();
  });

  it("keeps an upgrade action available for a paid user at the account limit", () => {
    render(
      <PlanStep
        connectionUpgrade
        isRefreshing={false}
        onDashboard={vi.fn()}
        onRefresh={vi.fn()}
        paid
        plan="ECHO"
        refreshError={null}
      />
    );

    expect(screen.getByText(ACCOUNT_LIMIT_REACHED)).toBeTruthy();
    expect(screen.getByRole("button", { name: START_CHECKOUT })).toBeTruthy();
  });
});
