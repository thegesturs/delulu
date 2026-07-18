"use client";

import type { ReactNode } from "react";

interface ComposerHandoffLinkProps {
  "aria-label"?: string;
  children: ReactNode;
  className?: string;
  handoffUrl: string;
  target?: "_blank" | "_parent" | "_self" | "_top";
}

const publicComposerUrl = (handoffUrl: string): string => {
  const url = new URL(handoffUrl);
  url.hash = "";
  url.search = "";
  return url.toString();
};

export function ComposerHandoffLink({
  "aria-label": ariaLabel,
  children,
  className,
  handoffUrl,
  target,
}: ComposerHandoffLinkProps) {
  return (
    <a
      aria-label={ariaLabel}
      className={className}
      href={publicComposerUrl(handoffUrl)}
      onClick={(event) => {
        // Keep per-draft query strings out of crawlable HTML while preserving
        // the complete handoff for real clicks, including modified clicks.
        event.currentTarget.href = handoffUrl;
      }}
      rel="nofollow noopener noreferrer"
      target={target}
    >
      {children}
    </a>
  );
}
