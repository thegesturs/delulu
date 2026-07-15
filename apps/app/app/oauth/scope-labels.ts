export const SCOPE_LABELS: Record<string, string> = {
  "posts:read": "View your posts and drafts",
  "posts:write": "Create, edit, schedule, and publish posts",
  "accounts:read": "View your connected social accounts",
  "accounts:write": "Connect and disconnect social accounts",
  "stats:read": "View your usage and subscription",
  "billing:write": "Start checkout for an eligible workspace",
  "media:write": "Upload and import media",
  "reviews:read": "View approval requests",
  "reviews:write": "Approve or reject posts",
  "members:read": "View workspace members",
  "members:write": "Manage workspace members",
  "apikeys:write": "Create and revoke API keys",
};

export type WorkspaceRole = "viewer" | "editor" | "admin" | "owner";

const READ_SCOPES = [
  "posts:read",
  "accounts:read",
  "stats:read",
  "reviews:read",
  "members:read",
];

export const ROLE_SCOPE_CEILING: Record<WorkspaceRole, readonly string[]> = {
  viewer: READ_SCOPES,
  editor: [
    ...READ_SCOPES,
    "posts:write",
    "accounts:write",
    "media:write",
    "reviews:write",
  ],
  admin: [
    ...READ_SCOPES,
    "posts:write",
    "accounts:write",
    "media:write",
    "reviews:write",
    "members:write",
    "apikeys:write",
  ],
  owner: [
    ...READ_SCOPES,
    "posts:write",
    "accounts:write",
    "media:write",
    "reviews:write",
    "members:write",
    "apikeys:write",
    "billing:write",
  ],
};
