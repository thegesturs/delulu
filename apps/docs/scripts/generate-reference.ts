import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Api } from "@delulu/contracts";
import { OpenApi } from "effect/unstable/httpapi";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "content/docs/api-reference/generated");
const publicSpec = path.join(root, "public/openapi.json");
const spec = OpenApi.fromApi(Api);
spec.servers = [{ url: "https://api.delulu.social" }];

const methodOrder = ["get", "post", "put", "patch", "delete"] as const;
type Method = (typeof methodOrder)[number];
type JsonRecord = Record<string, unknown>;

interface OperationEntry {
  method: Method;
  path: string;
  operation: JsonRecord;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const escapeFrontmatter = (value: string) =>
  JSON.stringify(value.replace(/\s+/g, " ").trim());

const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" ? (value as JsonRecord) : {};

const schemaBlock = (value: unknown) =>
  `\n\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n`;

const operationTitle = (entry: OperationEntry) => {
  const summary = entry.operation.summary;
  if (typeof summary === "string" && summary.length > 0) {
    return summary;
  }
  const id = entry.operation.operationId;
  return typeof id === "string" && id.length > 0
    ? id.replace(/([a-z])([A-Z])/g, "$1 $2")
    : `${entry.method.toUpperCase()} ${entry.path}`;
};

const renderParameters = (operation: JsonRecord) => {
  const parameters = Array.isArray(operation.parameters)
    ? operation.parameters.map(asRecord)
    : [];
  if (parameters.length === 0) {
    return "No path or query parameters.";
  }
  const rows = parameters.map((parameter) => {
    const schema = asRecord(parameter.schema);
    const required = parameter.required === true ? "yes" : "no";
    const type =
      typeof schema.type === "string"
        ? schema.type
        : typeof schema.$ref === "string"
          ? schema.$ref.split("/").at(-1)
          : "value";
    return `| \`${String(parameter.name)}\` | ${String(parameter.in)} | ${required} | ${type} |`;
  });
  return [
    "| Name | In | Required | Type |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
};

const renderResponses = (operation: JsonRecord) => {
  const responses = asRecord(operation.responses);
  const rows = Object.entries(responses).map(([status, raw]) => {
    const response = asRecord(raw);
    return `| \`${status}\` | ${String(response.description ?? "Response").replace(/\|/g, "\\|")} |`;
  });
  const bodies = Object.entries(responses).flatMap(([status, raw]) => {
    const content = asRecord(asRecord(raw).content);
    return Object.entries(content).map(([mediaType, media]) => {
      const schema = asRecord(media).schema;
      return `#### \`${status}\` — ${mediaType}${schemaBlock(schema)}`;
    });
  });
  return [
    "| Status | Meaning |",
    "| --- | --- |",
    ...rows,
    "",
    "### Response bodies",
    "",
    bodies.length > 0
      ? bodies.join("\n")
      : "This operation does not declare a response body.",
  ].join("\n");
};

const renderRequestBody = (operation: JsonRecord) => {
  const requestBody = asRecord(operation.requestBody);
  if (Object.keys(requestBody).length === 0) {
    return "### Request body\n\nNo request body.";
  }
  const required = requestBody.required === true ? " Required." : " Optional.";
  const schemas = Object.entries(asRecord(requestBody.content)).map(
    ([mediaType, media]) =>
      `#### ${mediaType}${schemaBlock(asRecord(media).schema)}`
  );
  return `### Request body\n\n${required}\n\n${schemas.length > 0 ? schemas.join("\n") : "No payload schema is declared."}`;
};

const renderOperation = (entry: OperationEntry) => {
  const description =
    typeof entry.operation.description === "string"
      ? `\n\n${entry.operation.description}`
      : "";
  return `## ${operationTitle(entry)}\n\n\`${entry.method.toUpperCase()} ${entry.path}\`${description}\n\n### Parameters\n\n${renderParameters(entry.operation)}\n\n${renderRequestBody(entry.operation)}\n\n### Responses\n\n${renderResponses(entry.operation)}`;
};

const grouped = new Map<string, OperationEntry[]>();
for (const [route, rawPathItem] of Object.entries(spec.paths)) {
  const pathItem = asRecord(rawPathItem);
  for (const method of methodOrder) {
    const rawOperation = pathItem[method];
    if (!rawOperation) {
      continue;
    }
    const operation = asRecord(rawOperation);
    const tag =
      Array.isArray(operation.tags) && typeof operation.tags[0] === "string"
        ? operation.tags[0]
        : "Other";
    grouped.set(tag, [
      ...(grouped.get(tag) ?? []),
      { method, path: route, operation },
    ]);
  }
}

await rm(output, { force: true, recursive: true });
await mkdir(output, { recursive: true });
await mkdir(path.dirname(publicSpec), { recursive: true });
await writeFile(publicSpec, `${JSON.stringify(spec, null, 2)}\n`);

const pages: string[] = ["index"];
const groups: Array<{ count: number; slug: string; tag: string }> = [];
let operationCount = 0;
for (const [tag, entries] of [...grouped].sort(([a], [b]) =>
  a.localeCompare(b)
)) {
  const slug = slugify(tag);
  pages.push(slug);
  groups.push({ count: entries.length, slug, tag });
  operationCount += entries.length;
  const body = `---\ntitle: ${escapeFrontmatter(tag)}\ndescription: ${escapeFrontmatter(`${entries.length} ${entries.length === 1 ? "endpoint" : "endpoints"} in the ${tag} API group.`)}\n---\n\nGenerated from the typed server contract. [Download the complete OpenAPI 3.1 specification](/openapi.json).\n\n${entries.map(renderOperation).join("\n\n---\n\n")}\n`;
  await writeFile(path.join(output, `${slug}.mdx`), body);
}

const indexBody = `---
title: Endpoint groups
description: ${escapeFrontmatter(`${operationCount} operations generated from the typed API contract.`)}
---

These reference pages are regenerated from the same Effect contract used by the server. They document the exact methods, paths, parameters, request bodies, and response statuses shipped by the API.

[Download the OpenAPI 3.1 specification](/openapi.json) or use the [interactive API explorer](/api-explorer/).

${groups
  .map(
    ({ count, slug, tag }) =>
      `- [${tag}](/api-reference/generated/${slug}/) — ${count} ${count === 1 ? "operation" : "operations"}`
  )
  .join("\n")}
`;
await writeFile(path.join(output, "index.mdx"), indexBody);

await writeFile(
  path.join(output, "meta.json"),
  `${JSON.stringify(
    {
      title: "Endpoint groups",
      description: `${operationCount} operations generated from the typed API contract.`,
      pages,
    },
    null,
    2
  )}\n`
);

console.log(
  `Generated ${operationCount} API operations across ${groups.length} groups.`
);
