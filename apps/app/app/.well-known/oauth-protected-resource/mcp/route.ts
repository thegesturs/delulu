import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from "mcp-handler";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.delulu.social";
const handler = protectedResourceHandler({
  authServerUrls: [apiUrl],
  resourceUrl: apiUrl,
});
const corsHandler = metadataCorsOptionsRequestHandler();

export { corsHandler as OPTIONS, handler as GET };
