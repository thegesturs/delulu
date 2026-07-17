import type {
  Folder,
  Item,
  Node,
  Root,
  Separator,
} from "fumadocs-core/page-tree";
import {
  SidebarIcon,
  type SidebarIconKind,
} from "@/components/docs-navigation";

const pageMatches = (node: Node, prefix: string): boolean => {
  if (node.type === "page") {
    return node.url === prefix || node.url.startsWith(`${prefix}/`);
  }
  if (node.type !== "folder") {
    return false;
  }
  return (
    (node.index ? pageMatches(node.index, prefix) : false) ||
    node.children.some((child) => pageMatches(child, prefix))
  );
};

const findFolder = (tree: Root, prefix: string): Folder => {
  const folder = tree.children.find(
    (node): node is Folder =>
      node.type === "folder" && pageMatches(node, prefix)
  );
  if (!folder) {
    throw new Error(`Missing documentation folder for ${prefix}`);
  }
  return folder;
};

const findPage = (node: Folder, url: string): Item | undefined => {
  if (node.index?.url === url) {
    return node.index;
  }
  for (const child of node.children) {
    if (child.type === "page" && child.url === url) {
      return child;
    }
    if (child.type === "folder") {
      const match = findPage(child, url);
      if (match) {
        return match;
      }
    }
  }
};

const iconKindForUrl = (url: string): SidebarIconKind => {
  if (url === "/") {
    return "home";
  }
  if (url.includes("account")) {
    return "account";
  }
  if (url.includes("workspace")) {
    return "workspace";
  }
  if (url.includes("media")) {
    return "media";
  }
  if (url.includes("publish") || url.includes("lifecycle")) {
    return "publish";
  }
  if (url.includes("review") || url.includes("roles-and-scopes")) {
    return "review";
  }
  if (url.includes("billing")) {
    return "billing";
  }
  if (url.includes("automation")) {
    return "automation";
  }
  if (url.startsWith("/mcp") || url.includes("agent")) {
    return "agent";
  }
  if (url.startsWith("/api-reference") || url.includes("api-quickstart")) {
    return "api";
  }
  if (url.startsWith("/cli") || url.includes("cli-quickstart")) {
    return "terminal";
  }
  if (url.includes("configuration")) {
    return "settings";
  }
  return "document";
};

const sidebarNames: Record<string, string> = {
  "/": "Overview",
  "/api-reference/generated": "Endpoint overview",
  "/concepts/agent-authorization": "Agent authorization",
  "/concepts/roles-and-scopes": "Roles & scopes",
  "/getting-started/agent-setup": "Set up an AI agent",
  "/getting-started/cli-quickstart": "Publish with the CLI",
  "/guides/accounts": "Connect social accounts",
  "/guides/automation": "CLI automation",
  "/guides/billing": "Billing & onboarding",
  "/guides/media": "Prepare media",
  "/guides/publishing": "Draft, schedule & publish",
  "/guides/reviews": "Work with reviews",
  "/guides/workspaces": "Select a workspace",
};

const decorateItem = (item: Item): Item => ({
  ...item,
  icon: <SidebarIcon kind={iconKindForUrl(item.url)} />,
  name: sidebarNames[item.url] ?? item.name,
});

const sectionNodes = (folder: Folder): Node[] => {
  const separator: Separator = {
    $id: `${folder.$id ?? String(folder.name)}-separator`,
    name: folder.name,
    type: "separator",
  };
  return [
    separator,
    ...(folder.index
      ? [
          decorateItem({
            ...folder.index,
            name:
              folder.index.name === folder.name
                ? "Overview"
                : folder.index.name,
          }),
        ]
      : []),
    ...folder.children.flatMap((node) => {
      if (node.type === "folder") {
        return sectionNodes(node);
      }
      if (node.type === "page") {
        return [decorateItem(node)];
      }
      return [node];
    }),
  ];
};

const createRoot = ({
  children,
  description,
  id,
  index,
  name,
}: {
  children: Node[];
  description: string;
  id: string;
  index: Item;
  name: string;
}): Folder => ({
  $id: id,
  children,
  description,
  index: decorateItem(index),
  name,
  root: true,
  type: "folder",
});

export const organizeDocsTree = (tree: Root): Root => {
  const home = tree.children.find(
    (node): node is Item => node.type === "page" && node.url === "/"
  );
  const gettingStarted = findFolder(tree, "/getting-started");
  const guides = findFolder(tree, "/guides");
  const concepts = findFolder(tree, "/concepts");
  const cli = findFolder(tree, "/cli");
  const agents = findFolder(tree, "/mcp");
  const api = findFolder(tree, "/api-reference");
  const cliIndex = findPage(cli, "/cli/overview");
  const apiIndex = findPage(api, "/api-reference");

  if (!(home && cliIndex && apiIndex)) {
    throw new Error("Documentation root pages are incomplete");
  }

  return {
    ...tree,
    $id: "delulu-docs-organized-v1",
    children: [
      createRoot({
        id: "docs-root-documentation",
        name: "Documentation",
        description: "Setup, workflows, and product concepts.",
        index: home,
        children: [
          decorateItem(home),
          ...sectionNodes(gettingStarted),
          ...sectionNodes(guides),
          ...sectionNodes(concepts),
        ],
      }),
      createRoot({
        id: "docs-root-cli-agents",
        name: "CLI & Agents",
        description: "Commands and structured agent tools.",
        index: cliIndex,
        children: [...sectionNodes(cli), ...sectionNodes(agents)],
      }),
      createRoot({
        id: "docs-root-api",
        name: "API Reference",
        description: "REST contracts and endpoints.",
        index: apiIndex,
        children: sectionNodes(api),
      }),
    ],
  };
};
