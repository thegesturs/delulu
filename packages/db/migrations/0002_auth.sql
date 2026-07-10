-- M1 auth: assignable frozen role + scopes on API keys, and the own OAuth 2.1
-- Authorization Server tables (clients, authorization codes, consent grants,
-- rotated refresh tokens). Additive-only; api_keys is empty pre-cutover so the
-- backfill defaults are dropped immediately after the columns land.

ALTER TABLE api_keys
  ADD COLUMN role workspace_role NOT NULL DEFAULT 'viewer',
  ADD COLUMN scopes text[] NOT NULL DEFAULT '{}';
ALTER TABLE api_keys
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN scopes DROP DEFAULT;

CREATE TABLE oauth_clients (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  client_id text NOT NULL UNIQUE, name text NOT NULL,
  token_endpoint_auth_method text NOT NULL DEFAULT 'none'
    CHECK (token_endpoint_auth_method IN ('none', 'client_secret_basic')),
  redirect_uris text[] NOT NULL DEFAULT '{}',
  first_party boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE oauth_authorization_codes (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  code_hash text NOT NULL UNIQUE,
  client_id text NOT NULL REFERENCES oauth_clients(client_id),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scopes text[] NOT NULL DEFAULT '{}',
  code_challenge text NOT NULL,
  code_challenge_method text NOT NULL DEFAULT 'S256' CHECK (code_challenge_method = 'S256'),
  redirect_uri text NOT NULL, resource text,
  expires_at timestamptz NOT NULL, consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE oauth_grants (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES oauth_clients(client_id),
  scopes text[] NOT NULL DEFAULT '{}', revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_id)
);

CREATE TABLE oauth_refresh_tokens (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  token_hash text NOT NULL UNIQUE,
  grant_id text NOT NULL REFERENCES oauth_grants(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES oauth_clients(client_id),
  scopes text[] NOT NULL DEFAULT '{}', resource text,
  family_id text NOT NULL, rotated_from text,
  expires_at timestamptz NOT NULL, revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX oauth_refresh_tokens_family_idx ON oauth_refresh_tokens(family_id);

-- Seed first-party public clients (#149). PKCE-only, no client secret. CLI uses
-- RFC 8252 loopback redirects (port-agnostic match at the AS); hosted MCP uses
-- its fixed callback. Ids are stable so seeds are idempotent-safe to reference.
INSERT INTO oauth_clients (id, client_id, name, token_endpoint_auth_method, redirect_uris, first_party)
VALUES
  ('oauth_client_clidelulu001', 'delulu-cli', 'Delulu CLI', 'none',
    ARRAY['http://127.0.0.1/callback', 'http://localhost/callback']::text[], true),
  ('oauth_client_mcpdelulu001', 'delulu-mcp', 'Delulu MCP', 'none',
    ARRAY['https://mcp.delulu.social/oauth/callback']::text[], true);

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['oauth_clients','oauth_authorization_codes','oauth_grants','oauth_refresh_tokens']
  LOOP
    EXECUTE format('CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', table_name, table_name);
  END LOOP;
END
$$;
