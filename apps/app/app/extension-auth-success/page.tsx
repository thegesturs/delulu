"use client";

import Link from "next/link";

export default function ExtensionAuthSuccessPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="mx-auto max-w-md space-y-6 px-6 text-center">
        <div className="text-6xl">🎉</div>
        <h1 className="font-bold text-2xl tracking-tight">You're signed in!</h1>
        <p className="text-muted-foreground">
          You have been signed into the Sorted extension. You can close this tab
          and return to the extension popup.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
            href="/"
          >
            Go to Delulu Social
          </Link>
          <button
            className="text-muted-foreground text-sm underline underline-offset-4 hover:text-foreground"
            onClick={() => window.close()}
            type="button"
          >
            Close this tab
          </button>
        </div>
      </div>
    </div>
  );
}
