import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import Page from "../app/(unauthenticated)/sign-up/[[...sign-up]]/page";

vi.mock("@delulu/auth", () => ({
  SignUp: () => <h1>Create an account</h1>,
}));

test("Sign Up Page", () => {
  render(<Page />);
  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "Create an account",
    })
  ).toBeDefined();
});
