import { Logo } from "@delulu/design-system/components/logo";
import { ModeToggle } from "@delulu/design-system/components/mode-toggle";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  readonly children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => (
  <div className="container relative grid h-dvh max-w-none grid-cols-1 flex-col items-center justify-center md:grid-cols-2 lg:px-0">
    <div className="relative hidden h-full flex-col bg-muted p-10 text-white md:flex dark:border-r">
      <div className="absolute inset-0 bg-zinc-900" />
      <div className="relative z-20 flex items-start justify-between">
        <Logo className="text-white" />
        <ModeToggle />
      </div>
      <div className="relative z-20 mt-auto">
        <blockquote className="space-y-2">
          <p className="text-lg">
            &ldquo;Delulu has completely transformed how I manage my social
            media — scheduling, automations, and analytics all in one
            place.&rdquo;
          </p>
          <footer className="text-sm">Happy Creator</footer>
        </blockquote>
      </div>
    </div>
    <div className="w-full p-8">
      <div className="mx-auto flex w-full flex-col items-center justify-center space-y-6">
        <div className="mb-4 md:hidden">
          <Logo className="text-foreground" />
        </div>
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
