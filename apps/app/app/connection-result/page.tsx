import { auth } from "@delulu/auth/server";
import { Logo } from "@delulu/design-system/components/logo";
import { Button } from "@delulu/design-system/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ConnectionResultPage() {
  const { sessionClaims } = await auth();
  const metadata = sessionClaims?.metadata as
    | { onboardingComplete?: boolean }
    | undefined;
  const destination =
    metadata?.onboardingComplete === true ? "/socials" : "/onboarding";

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
      <section className="w-full max-w-md space-y-6 rounded-2xl border bg-background p-7 shadow-sm">
        <Logo />
        <div className="space-y-2">
          <h1 className="font-semibold text-2xl tracking-tight">
            This connection attempt expired
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            For your security, connection links only work for a short time.
            Nothing was changed. Start again from the app.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href={destination}>Return to connections</Link>
        </Button>
      </section>
    </main>
  );
}
