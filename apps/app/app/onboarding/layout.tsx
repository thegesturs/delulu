import { auth } from "@delulu/auth/server";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sessionClaims } = await auth();

  // If user has already completed onboarding, redirect to home
  const metadata = sessionClaims?.metadata as
    | { onboardingComplete?: boolean }
    | undefined;
  if (metadata?.onboardingComplete === true) {
    redirect("/");
  }

  return <>{children}</>;
}
