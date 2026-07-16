import { navigate } from "astro:transitions/client";
import type { AstroProviderProps } from "fumadocs-core/framework/astro";
import type { Root } from "fumadocs-core/page-tree";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { DocsPage, type DocsPageProps } from "fumadocs-ui/layouts/docs/page";
import { RootProvider } from "fumadocs-ui/provider/astro";
import type { ReactNode } from "react";
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
  return (
    <RootProvider
      navigate={navigate}
      params={params}
      pathname={pathname}
      search={{ SearchDialog: DocsSearch }}
    >
      <DocsLayout
        githubUrl="https://github.com/thegesturs/delulu"
        links={[
          { text: "Dashboard", url: "https://solulu.delulu.social" },
          { text: "API explorer", url: "/api-explorer/" },
        ]}
        nav={{
          title: (
            <span className="flex items-center gap-2 font-semibold">
              <span className="grid size-6 place-items-center rounded-md bg-fd-primary text-fd-primary-foreground text-xs">
                D
              </span>
              Delulu Docs
            </span>
          ),
        }}
        tree={tree}
      >
        <DocsPage {...page}>{children}</DocsPage>
      </DocsLayout>
    </RootProvider>
  );
}
