-- Workspace-bound OAuth tokens. A first-party client (e.g. the CLI) can be
-- authorized against a single workspace at the consent screen; the binding is
-- carried from the authorization code through the rotated refresh chain and
-- surfaced as a `wid` claim on the access token, mirroring how API keys bind
-- via `key_workspace_id`. NULL = unrestricted (the token works against every
-- workspace the user belongs to, narrowed only by that workspace's role
-- ceiling) — this preserves today's behavior for clients that skip selection.
ALTER TABLE oauth_authorization_codes
  ADD COLUMN workspace_id text REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE oauth_refresh_tokens
  ADD COLUMN workspace_id text REFERENCES workspaces(id) ON DELETE CASCADE;
