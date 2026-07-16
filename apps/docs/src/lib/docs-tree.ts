import type { Folder, Item, Node, Root } from "fumadocs-core/page-tree";

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
  return {
    ...folder,
    collapsible: false,
    defaultOpen: true,
    root: undefined,
  };
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

const createRoot = ({
  children,
  description,
  id,
  index,
  name,
}: {
  children: Folder[];
  description: string;
  id: string;
  index: Item;
  name: string;
}): Folder => ({
  $id: id,
  children,
  description,
  index,
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
  const development = findFolder(tree, "/development");
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
        children: [gettingStarted, guides, concepts],
      }),
      createRoot({
        id: "docs-root-cli-agents",
        name: "CLI & Agents",
        description: "Commands and structured agent tools.",
        index: cliIndex,
        children: [cli, agents],
      }),
      createRoot({
        id: "docs-root-api",
        name: "API Reference",
        description: "REST contracts and local development.",
        index: apiIndex,
        children: [api, development],
      }),
    ],
  };
};
