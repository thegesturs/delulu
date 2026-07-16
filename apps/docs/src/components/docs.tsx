import { navigate } from "astro:transitions/client";
import type { AstroProviderProps } from "fumadocs-core/framework/astro";
import type { Root } from "fumadocs-core/page-tree";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { DocsPage, type DocsPageProps } from "fumadocs-ui/layouts/docs/page";
import { RootProvider } from "fumadocs-ui/provider/astro";
import type { ReactNode } from "react";
import DocsSearch from "./search";

const ExternalLinkIcon = () => (
  <svg
    aria-hidden="true"
    className="size-3.5 shrink-0"
    fill="none"
    viewBox="0 0 16 16"
  >
    <path
      d="M6 3h7v7M13 3 5.25 10.75M11 9.5V13H3V5h3.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.4"
    />
  </svg>
);

const NavExternalLink = ({ href, label }: { href: string; label: string }) => (
  <a
    className="docs-external-link"
    href={href}
    rel="noreferrer"
    target="_blank"
  >
    <span>{label}</span>
    <ExternalLinkIcon />
  </a>
);

const sectionIcons: Record<string, string> = {
  "/getting-started": "🚀",
  "/guides": "🧭",
  "/cli": "⌘",
  "/mcp": "✨",
  "/api-reference": "⚡",
  "/concepts": "🧠",
  "/development": "🛠️",
};

export function Docs({
  tree,
  children,
  pathname,
  params,
  page,
}: {
  tree: Root;
  children: ReactNode;
  pathname: string;
  params: AstroProviderProps["params"];
  page?: DocsPageProps;
}) {
  return (
    <RootProvider
      navigate={navigate}
      params={params}
      pathname={pathname}
      search={{ SearchDialog: DocsSearch }}
    >
      <DocsLayout
        containerProps={{ className: "docs-shell" }}
        githubUrl="https://github.com/thegesturs/delulu"
        links={[
          {
            type: "custom",
            secondary: true,
            children: (
              <NavExternalLink
                href="https://solulu.delulu.social"
                label="Dashboard"
              />
            ),
          },
          {
            type: "custom",
            secondary: true,
            children: (
              <NavExternalLink href="/api-explorer/" label="API explorer" />
            ),
          },
        ]}
        nav={{
          title: (
            <span className="docs-brand">
              <img
                alt=""
                className="docs-brand-mark"
                height="25"
                src="/favicon.svg"
                width="22"
              />
              <span className="docs-brand-name">Delulu</span>
              <span className="docs-brand-badge">Docs</span>
            </span>
          ),
        }}
        sidebar={{ defaultOpenLevel: 1, prefetch: false }}
        tabs={{
          transform: (option) => {
            const path = new URL(option.url, "https://docs.delulu.social")
              .pathname;
            const icon = Object.entries(sectionIcons).find(([prefix]) =>
              path.startsWith(prefix)
            )?.[1];
            return {
              ...option,
              icon: icon ? (
                <span aria-hidden="true" className="docs-section-icon">
                  {icon}
                </span>
              ) : (
                option.icon
              ),
            };
          },
        }}
        tree={tree}
      >
        <DocsPage {...page}>{children}</DocsPage>
      </DocsLayout>
    </RootProvider>
  );
}
