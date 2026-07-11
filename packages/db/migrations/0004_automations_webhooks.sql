-- M3 automation execution, webhook replay safety, and KV repair source data.

ALTER TABLE automations
  ADD COLUMN name text NOT NULL DEFAULT 'Untitled automation',
  ADD COLUMN description text,
  ADD COLUMN triggers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN node_positions jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN total_triggered integer NOT NULL DEFAULT 0 CHECK (total_triggered >= 0),
  ADD COLUMN total_dms_sent integer NOT NULL DEFAULT 0 CHECK (total_dms_sent >= 0),
  ADD COLUMN total_failed integer NOT NULL DEFAULT 0 CHECK (total_failed >= 0);

ALTER TABLE subscriptions
  ADD COLUMN dms_sent_period_start timestamptz,
  ADD COLUMN dms_reserved bigint NOT NULL DEFAULT 0 CHECK (dms_reserved >= 0);
ALTER TABLE users ADD COLUMN identity_deleted_at timestamptz;

CREATE TABLE automation_trigger_index (
  automation_id text NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  connection_id text NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  profile_id text NOT NULL,
  media_id text NOT NULL,
  enabled boolean NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (automation_id, media_id)
);
CREATE INDEX automation_trigger_lookup_idx
  ON automation_trigger_index (profile_id, media_id, automation_id)
  WHERE enabled = true;

CREATE TABLE automation_trigger_repairs (
  profile_id text NOT NULL,
  media_id text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, media_id)
);

CREATE TABLE automation_sessions (
  id text PRIMARY KEY,
  legacy_convex_id text UNIQUE,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  automation_id text NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  platform_user_id text NOT NULL,
  platform_username text,
  current_step_id text NOT NULL,
  trigger_event_id text,
  trigger_media_id text,
  status text NOT NULL CHECK (status IN ('active', 'completed', 'expired')),
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_activity_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX automation_sessions_active_idx
  ON automation_sessions (automation_id, platform_user_id)
  WHERE status = 'active';
CREATE INDEX automation_sessions_inbox_idx
  ON automation_sessions (workspace_id, last_activity_at DESC);

CREATE TABLE webhook_deliveries (
  id text PRIMARY KEY,
  legacy_convex_id text UNIQUE,
  provider text NOT NULL CHECK (provider IN ('meta', 'clerk', 'dodo')),
  event_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('processing', 'processed', 'failed')),
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts > 0),
  payload jsonb NOT NULL,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);
CREATE INDEX webhook_deliveries_retry_idx
  ON webhook_deliveries (updated_at)
  WHERE status IN ('processing', 'failed');

CREATE TABLE automation_dm_dispatches (
  provider text NOT NULL,
  event_id text NOT NULL,
  automation_id text NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  platform_user_id text NOT NULL,
  step_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('reserved', 'sent', 'skipped', 'failed', 'ambiguous')),
  failure_state text CHECK (failure_state IN ('not_sent', 'unknown')),
  provider_message_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, event_id, automation_id, platform_user_id, step_id)
);

CREATE INDEX automations_workspace_category_idx
  ON automations (workspace_id, platform, category, created_at DESC);
CREATE INDEX automation_runs_workspace_idx
  ON automation_runs (workspace_id, started_at DESC);
CREATE INDEX automation_contacts_workspace_idx
  ON automation_contacts (workspace_id, updated_at DESC);

CREATE TRIGGER automation_sessions_set_updated_at BEFORE UPDATE ON automation_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER webhook_deliveries_set_updated_at BEFORE UPDATE ON webhook_deliveries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER automation_dm_dispatches_set_updated_at BEFORE UPDATE ON automation_dm_dispatches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
