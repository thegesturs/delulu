import { navigate } from "astro:transitions/client";
import type { AstroProviderProps } from "fumadocs-core/framework/astro";
import type { Root } from "fumadocs-core/page-tree";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { DocsPage, type DocsPageProps } from "fumadocs-ui/layouts/docs/page";
import { RootProvider } from "fumadocs-ui/provider/astro";
import type { ReactNode } from "react";
import { organizeDocsTree } from "@/lib/docs-tree";
import { DocsMobileSections, DocsShell } from "./docs-shell";
import DocsSearch from "./search";

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
        githubUrl="https://github.com/thegesturs/delulu"
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
        sidebar={{
          banner: <DocsMobileSections />,
          defaultOpenLevel: 1,
          prefetch: false,
        }}
        slots={{ container: DocsShell }}
        tabs={false}
        tree={organizedTree}
      >
        <DocsPage {...page}>{children}</DocsPage>
      </DocsLayout>
    </RootProvider>
  );
}
