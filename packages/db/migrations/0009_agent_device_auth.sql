-- Agent authorization, onboarding reconciliation, and remote media imports.
CREATE TYPE oauth_device_status AS ENUM (
  'pending',
  'approved',
  'denied',
  'consumed'
);

CREATE TABLE oauth_device_authorizations (
  id text PRIMARY KEY,
  device_code_hash text NOT NULL UNIQUE,
  user_code_hash text NOT NULL UNIQUE,
  client_id text NOT NULL REFERENCES oauth_clients(client_id),
  user_id text REFERENCES users(id) ON DELETE CASCADE,
  workspace_id text REFERENCES workspaces(id) ON DELETE CASCADE,
  scopes text[] NOT NULL DEFAULT '{}',
  resource text,
  status oauth_device_status NOT NULL DEFAULT 'pending',
  interval_seconds integer NOT NULL DEFAULT 5 CHECK (interval_seconds >= 1),
  last_polled_at timestamptz,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX oauth_device_authorizations_expires_idx
  ON oauth_device_authorizations(expires_at);

CREATE TRIGGER oauth_device_authorizations_set_updated_at
  BEFORE UPDATE ON oauth_device_authorizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE users
  ADD COLUMN onboarding_optional jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN onboarding_completed_at timestamptz,
  ADD COLUMN onboarding_metadata_synced_at timestamptz;

ALTER TABLE media ADD COLUMN import_key text;
CREATE UNIQUE INDEX media_workspace_import_key_idx
  ON media(workspace_id, import_key)
  WHERE import_key IS NOT NULL AND deleted_at IS NULL;

CREATE TYPE media_import_status AS ENUM ('pending', 'completed', 'failed');
CREATE TABLE media_imports (
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  media_id text REFERENCES media(id) ON DELETE SET NULL,
  status media_import_status NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, idempotency_key)
);
