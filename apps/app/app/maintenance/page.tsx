import { Logo } from "@delulu/design-system/components/logo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maintenance in progress | Delulu",
  description:
    "Delulu is temporarily offline for a major infrastructure upgrade.",
  robots: {
    index: false,
    follow: false,
  },
};

const MaintenancePage = () => (
  <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-5 py-12 text-foreground sm:px-8">
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.5216_0.2318_273.3197/0.14),transparent_42%)]"
    />

    <section className="relative w-full max-w-xl text-center">
      <Logo className="mb-12 justify-center text-primary" />

      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground text-sm shadow-xs">
        <span aria-hidden="true" className="relative flex size-2">
          <span className="absolute inline-flex size-full rounded-full bg-amber-400 opacity-40" />
          <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
        </span>
        Maintenance in progress
      </div>

      <h1 className="text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
        We’re making Delulu better.
      </h1>
      <p className="mx-auto mt-5 max-w-lg text-balance text-lg text-muted-foreground leading-8">
        We’re completing a major infrastructure upgrade to make publishing
        faster and more reliable. The app will be back within 48 hours.
      </p>

      <div className="mt-10 rounded-xl border border-border bg-card p-5 text-left shadow-sm sm:p-6">
        <p className="font-medium">Your account and existing data are safe.</p>
        <p className="mt-2 text-muted-foreground text-sm leading-6">
          Dashboard access, scheduled publishing, and automations are paused
          during the upgrade. You don’t need to do anything—we’ll bring
          everything back online when the work is complete.
        </p>
      </div>

      <p className="mt-8 text-muted-foreground text-sm">
        Need help?{" "}
        <a
          className="inline-flex items-center font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
          href="mailto:support@delulu.social"
        >
          support@delulu.social
        </a>
      </p>
    </section>
  </main>
);

export default MaintenancePage;
