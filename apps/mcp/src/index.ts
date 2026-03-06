#!/usr/bin/env node
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

const apiUrl = process.env.DELULU_API_URL || "https://api.delulu.social";
const apiKey = process.env.DELULU_API_KEY;

if (!apiKey) {
  console.error("DELULU_API_KEY environment variable is required");
  process.exit(1);
}

const transport = process.argv.includes("--sse") ? "sse" : "stdio";

const server = createServer(apiUrl, apiKey);

if (transport === "stdio") {
  const stdioTransport = new StdioServerTransport();
  await server.connect(stdioTransport);
} else {
  // SSE transport — listen on port
  const port = Number(process.env.PORT) || 3100;

  const { createServer: createHttpServer } = await import("node:http");

  let sseTransport: SSEServerTransport | null = null;

  const httpServer = createHttpServer(async (req, res) => {
    if (req.url === "/sse") {
      sseTransport = new SSEServerTransport("/messages", res);
      await server.connect(sseTransport);
    } else if (req.url === "/messages" && req.method === "POST") {
      if (sseTransport) {
        await sseTransport.handlePostMessage(req, res);
      } else {
        res.writeHead(400);
        res.end("No SSE connection");
      }
    } else if (req.url === "/health") {
      res.writeHead(200);
      res.end("ok");
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  httpServer.listen(port, () => {
    console.error(`Delulu MCP server (SSE) listening on port ${port}`);
  });
}
