import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandlerClerk,
} from "@clerk/mcp-tools/next";

const handler = protectedResourceHandlerClerk({
  scopes_supported: ["openid", "profile", "email", "user:org:read"],
});
const corsHandler = metadataCorsOptionsRequestHandler();

export { handler as GET, corsHandler as OPTIONS };
