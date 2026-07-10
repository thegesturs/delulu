-- M2 domain services: durable scheduling/outbox and lifecycle indexes.

CREATE TYPE job_status AS ENUM ('pending', 'leased', 'dispatched', 'completed', 'failed');

ALTER TABLE workspaces ADD COLUMN deleted_at timestamptz;
ALTER TABLE media ADD COLUMN deleted_at timestamptz;

CREATE TABLE jobs (
  id text PRIMARY KEY,
  legacy_convex_id text UNIQUE,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  run_at timestamptz NOT NULL,
  status job_status NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
  locked_until timestamptz,
  last_error text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(payload) = 'object' AND payload ? '_tag')
);

CREATE INDEX jobs_due_idx ON jobs (run_at, created_at)
  WHERE status = 'pending';
CREATE INDEX jobs_lease_idx ON jobs (locked_until)
  WHERE status = 'leased';
CREATE INDEX posts_workspace_status_idx ON posts (workspace_id, status, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX post_targets_post_idx ON post_targets (post_id, created_at);
CREATE INDEX media_workspace_status_idx ON media (workspace_id, status, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX post_reviews_queue_idx ON post_reviews (workspace_id, status, updated_at DESC);
CREATE INDEX review_activity_feed_idx ON review_activity (workspace_id, post_id, created_at);
CREATE INDEX connections_workspace_idx ON connections (workspace_id, created_at DESC);
CREATE INDEX api_keys_workspace_idx ON api_keys (workspace_id, created_at DESC)
  WHERE revoked_at IS NULL;

CREATE TRIGGER jobs_set_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
