"use client";

import { useAnalytics } from "@delulu/analytics/posthog/client";
import Link, { type LinkProps } from "next/link";
import {
  type AnchorHTMLAttributes,
  forwardRef,
  type MouseEventHandler,
} from "react";

type TrackedLandingLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    destination: string;
    surface: string;
  };

export const TrackedLandingLink = forwardRef<
  HTMLAnchorElement,
  TrackedLandingLinkProps
>(function TrackedLandingLink(
  { destination, onClick, surface, ...props },
  ref
) {
  const analytics = useAnalytics();

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    analytics?.capture("landing_agent_cta_clicked", {
      destination,
      surface,
    });
    onClick?.(event);
  };

  return <Link {...props} onClick={handleClick} ref={ref} />;
});
