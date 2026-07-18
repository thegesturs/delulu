"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { cn } from "@delulu/design-system/lib/utils";
import { ArrowRight, Github, type LucideIcon, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TrackedLandingLink } from "@/components/home/tracked-landing-link";
import { Logo } from "@/components/logo";
import { LANDING_LINKS } from "@/lib/landing-links";
import ThemeToggle from "./theme-toggle";

const navigation: ReadonlyArray<{
  label: string;
  href: string;
  icon?: LucideIcon;
}> = [
  { label: "Agents", href: "/#agents" },
  { label: "Product", href: "/#product" },
  { label: "Open source", href: "/#open-source" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Docs", href: LANDING_LINKS.docs },
  { label: "GitHub", href: LANDING_LINKS.source, icon: Github },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className="relative z-50 w-full">
      <TrackedLandingLink
        className="flex min-h-11 items-center justify-center gap-2 border-b bg-muted/45 px-4 py-2 text-center font-medium text-muted-foreground text-xs sm:text-sm"
        destination="source"
        href={LANDING_LINKS.source}
        surface="announcement"
      >
        Delulu is open source. Run it on your infrastructure.
        <ArrowRight aria-hidden="true" className="size-3.5 shrink-0" />
      </TrackedLandingLink>

      <div className="sticky top-0 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Logo />

          <nav aria-label="Primary navigation" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {navigation.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <Link
                    className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-medium text-muted-foreground text-sm outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    href={href}
                  >
                    {Icon && <Icon aria-hidden="true" className="size-4" />}
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Button asChild variant="ghost">
              <Link href={LANDING_LINKS.app}>Sign in</Link>
            </Button>
            <Button asChild>
              <TrackedLandingLink
                destination="agent_setup"
                href={LANDING_LINKS.agentSetup}
                surface="navbar"
              >
                Connect your agent
              </TrackedLandingLink>
            </Button>
            <ThemeToggle className="size-10" />
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <Button asChild className="h-11" size="sm">
              <Link href={LANDING_LINKS.app}>Sign in</Link>
            </Button>
            <ThemeToggle className="size-11" />
            <button
              aria-expanded={open}
              aria-label={open ? "Close navigation" : "Open navigation"}
              className="flex size-11 touch-manipulation items-center justify-center rounded-lg outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setOpen((current) => !current)}
              type="button"
            >
              {open ? (
                <X aria-hidden="true" className="size-5" />
              ) : (
                <Menu aria-hidden="true" className="size-5" />
              )}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "absolute inset-x-0 top-full border-b bg-background px-4 shadow-xl lg:hidden",
            open ? "block" : "hidden"
          )}
        >
          <nav
            aria-label="Mobile navigation"
            className="mx-auto max-w-7xl py-3"
          >
            <ul className="grid gap-1">
              {navigation.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <Link
                    className="flex min-h-12 touch-manipulation items-center gap-3 rounded-lg px-3 font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    href={href}
                    onClick={() => setOpen(false)}
                  >
                    {Icon && <Icon aria-hidden="true" className="size-4" />}
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-3 h-11 w-full">
              <TrackedLandingLink
                destination="agent_setup"
                href={LANDING_LINKS.agentSetup}
                onClick={() => setOpen(false)}
                surface="mobile_navbar"
              >
                Connect your agent
              </TrackedLandingLink>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
