import { usePathname } from "fumadocs-core/framework";
import { useDocsLayout } from "fumadocs-ui/layouts/docs";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { useEffect, useState } from "react";

const ExternalIcon = () => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
    <path
      d="M6 3h7v7M13 3 5.25 10.75M11 9.5V13H3V5h3.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.35"
    />
  </svg>
);

const BookIcon = () => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
    <path
      d="M2.5 3.25A2.25 2.25 0 0 1 4.75 1H8v12H4.75a2.25 2.25 0 0 0-2.25 2V3.25ZM13.5 3.25A2.25 2.25 0 0 0 11.25 1H8v12h3.25a2.25 2.25 0 0 1 2.25 2V3.25Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
    />
  </svg>
);

const TerminalIcon = () => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
    <rect
      height="12"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.25"
      width="14"
      x="1"
      y="2"
    />
    <path
      d="m4 6 2 2-2 2M8.5 10H12"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
    />
  </svg>
);

const BracesIcon = () => (
  <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
    <path
      d="M6 2.5H5A1.5 1.5 0 0 0 3.5 4v2.25A1.75 1.75 0 0 1 2 8a1.75 1.75 0 0 1 1.5 1.75V12A1.5 1.5 0 0 0 5 13.5h1M10 2.5h1A1.5 1.5 0 0 1 12.5 4v2.25A1.75 1.75 0 0 0 14 8a1.75 1.75 0 0 0-1.5 1.75V12a1.5 1.5 0 0 1-1.5 1.5h-1"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
  </svg>
);

const topSections: Array<{
  href: string;
  icon: ReactNode;
  label: string;
  matches: (path: string) => boolean;
}> = [
  {
    href: "/",
    icon: <BookIcon />,
    label: "Documentation",
    matches: (path) =>
      path === "/" ||
      path.startsWith("/getting-started") ||
      path.startsWith("/guides") ||
      path.startsWith("/concepts"),
  },
  {
    href: "/cli/overview/",
    icon: <TerminalIcon />,
    label: "CLI & Agents",
    matches: (path) => path.startsWith("/cli") || path.startsWith("/mcp"),
  },
  {
    href: "/api-reference/",
    icon: <BracesIcon />,
    label: "API Reference",
    matches: (path) =>
      path.startsWith("/api-reference") || path.startsWith("/development"),
  },
];

const DocsTopbar = () => {
  const pathname = usePathname();
  return (
    <header className="docs-topbar">
      <nav aria-label="Documentation sections" className="docs-topbar-tabs">
        {topSections.map((section) => {
          const active = section.matches(pathname);
          return (
            <a
              aria-current={active ? "page" : undefined}
              className="docs-topbar-tab"
              data-active={active}
              href={section.href}
              key={section.href}
            >
              <span className="docs-topbar-icon">{section.icon}</span>
              <span>{section.label}</span>
            </a>
          );
        })}
      </nav>
      <nav aria-label="Product links" className="docs-topbar-actions">
        <a href="/api-explorer/" rel="noopener" target="_blank">
          <span>API explorer</span>
          <ExternalIcon />
        </a>
        <a href="https://solulu.delulu.social" rel="noreferrer" target="_blank">
          <span>Dashboard</span>
          <ExternalIcon />
        </a>
      </nav>
    </header>
  );
};

export const DocsMobileSections = () => {
  const pathname = usePathname();
  return (
    <nav aria-label="Documentation sections" className="docs-mobile-sections">
      {topSections.map((section) => {
        const active = section.matches(pathname);
        return (
          <a
            aria-current={active ? "page" : undefined}
            data-active={active}
            href={section.href}
            key={section.href}
          >
            <span className="docs-topbar-icon">{section.icon}</span>
            <span>{section.label}</span>
          </a>
        );
      })}
    </nav>
  );
};

type ShellStyle = CSSProperties & {
  "--fd-docs-row-1": string;
  "--fd-docs-row-2": string;
  "--fd-docs-row-3": string;
  "--fd-sidebar-col": string;
};

export const DocsShell = ({
  children,
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const { slots } = useDocsLayout();
  const { collapsed } = slots.sidebar.useSidebar();
  const [previousCollapsed, setPreviousCollapsed] = useState(collapsed);
  const columnChanged = previousCollapsed !== collapsed;

  useEffect(() => {
    if (columnChanged) {
      setPreviousCollapsed(collapsed);
    }
  }, [collapsed, columnChanged]);

  const shellStyle: ShellStyle = {
    gridTemplate: `"sidebar sidebar topbar topbar topbar" var(--docs-topbar-height)
"sidebar sidebar header toc toc"
"sidebar sidebar toc-popover toc toc"
"sidebar sidebar main toc toc" 1fr / 0px var(--fd-sidebar-col) min(760px, calc(100vw - var(--fd-sidebar-col) - var(--fd-toc-width))) var(--fd-toc-width) minmax(min-content, 1fr)`,
    "--fd-docs-row-1": "var(--fd-banner-height, 0px)",
    "--fd-docs-row-2": "calc(var(--fd-docs-row-1) + var(--fd-header-height))",
    "--fd-docs-row-3":
      "calc(var(--fd-docs-row-2) + var(--fd-toc-popover-height))",
    "--fd-sidebar-col": collapsed ? "0px" : "var(--fd-sidebar-width)",
    ...style,
  };

  return (
    <div
      className={`docs-shell${className ? ` ${className}` : ""}`}
      data-column-changed={columnChanged}
      data-sidebar-collapsed={collapsed}
      id="nd-docs-layout"
      style={shellStyle}
      {...props}
    >
      <DocsTopbar />
      {children}
    </div>
  );
};
