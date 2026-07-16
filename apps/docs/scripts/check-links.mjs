import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../dist");
const pages = [];

const walk = (directory) => {
  for (const name of readdirSync(directory)) {
    const file = join(directory, name);
    if (statSync(file).isDirectory()) {
      walk(file);
    } else if (file.endsWith(".html")) {
      pages.push(file);
    }
  }
};

const resolveTarget = (page, pathname) => {
  const absolute = pathname.startsWith("/")
    ? join(root, pathname)
    : resolve(dirname(page), pathname);
  const candidates = pathname.endsWith(".html")
    ? [absolute]
    : pathname.endsWith("/")
      ? [join(absolute, "index.html")]
      : [absolute, `${absolute}.html`, join(absolute, "index.html")];
  return candidates.find((candidate) => {
    try {
      return statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
};

walk(root);
const failures = [];
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|javascript:)/.test(href)) {
      continue;
    }
    const [pathname, fragment] = href.split("#", 2);
    if (!(pathname || fragment)) {
      continue;
    }
    if (pathname.startsWith("/api/search")) {
      continue;
    }
    const target = pathname ? resolveTarget(page, pathname) : page;
    if (!target) {
      failures.push(`${page.slice(root.length)} -> ${href} (missing target)`);
      continue;
    }
    if (fragment) {
      const targetHtml = readFileSync(target, "utf8");
      const id = decodeURIComponent(fragment).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      if (!new RegExp(`id=["']${id}["']`).test(targetHtml)) {
        failures.push(`${page.slice(root.length)} -> ${href} (missing anchor)`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`Broken documentation links:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(
  `Checked ${pages.length} generated pages: all internal links resolve.`
);
