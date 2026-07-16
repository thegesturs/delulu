import { navigate } from "astro:transitions/client";
import type { AstroProviderProps } from "fumadocs-core/framework/astro";
import type { Root } from "fumadocs-core/page-tree";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import {
  DocsPage,
  type DocsPageProps,
} from "fumadocs-ui/layouts/notebook/page";
import type { LinkItemType } from "fumadocs-ui/layouts/shared";
import { RootProvider } from "fumadocs-ui/provider/astro";
import type { ReactNode } from "react";
import { organizeDocsTree } from "@/lib/docs-tree";
import {
  ApiIcon,
  CliIcon,
  DocumentationIcon,
  ExternalIcon,
} from "./docs-navigation";
import DocsSearch from "./search";

const productLinks: LinkItemType[] = [
  {
    type: "custom",
    children: (
      <a
        className="docs-external-link"
        href="/api-explorer/"
        rel="noopener"
        target="_blank"
      >
        <span>API explorer</span>
        <ExternalIcon />
      </a>
    ),
  },
  {
    type: "custom",
    children: (
      <a
        className="docs-external-link"
        href="https://solulu.delulu.social"
        rel="noreferrer noopener"
        target="_blank"
      >
        <span>Dashboard</span>
        <ExternalIcon />
      </a>
    ),
  },
];

const iconForRoot = (id?: string): ReactNode => {
  if (id === "docs-root-cli-agents") {
    return <CliIcon />;
  }
  if (id === "docs-root-api") {
    return <ApiIcon />;
  }
  return <DocumentationIcon />;
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
  const organizedTree = organizeDocsTree(tree);
  return (
    <RootProvider
      navigate={navigate}
      params={params}
      pathname={pathname}
      search={{ SearchDialog: DocsSearch }}
    >
      <DocsLayout
        links={productLinks}
        nav={{
          mode: "top",
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
        sidebar={{
          collapsible: false,
          defaultOpenLevel: 0,
          prefetch: false,
        }}
        tabMode="navbar"
        tabs={{
          transform(option, node) {
            return {
              ...option,
              icon: iconForRoot(node.$id),
            };
          },
        }}
        tree={organizedTree}
      >
        <DocsPage {...page}>{children}</DocsPage>
      </DocsLayout>
    </RootProvider>
  );
}
