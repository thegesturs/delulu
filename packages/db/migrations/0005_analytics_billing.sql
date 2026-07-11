-- M4 analytics and billing: versioned stats caches and pooled quota ownership.

ALTER TABLE workspaces
  ADD COLUMN stats_version bigint NOT NULL DEFAULT 0 CHECK (stats_version >= 0);

ALTER TABLE subscriptions
  ADD COLUMN social_accounts bigint NOT NULL DEFAULT 0 CHECK (social_accounts >= 0),
  ADD COLUMN api_requests_per_month bigint NOT NULL DEFAULT 0 CHECK (api_requests_per_month >= 0),
  ADD COLUMN api_requests_period_start timestamptz,
  ADD COLUMN addons jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(addons) = 'object'),
  ADD COLUMN seat_quantity integer CHECK (seat_quantity IS NULL OR seat_quantity > 0),
  ADD COLUMN unit_price_minor bigint CHECK (unit_price_minor IS NULL OR unit_price_minor >= 0);

CREATE INDEX posts_workspace_published_idx
  ON posts (workspace_id, published_at DESC)
  WHERE deleted_at IS NULL AND published_at IS NOT NULL;

CREATE INDEX post_targets_scheduled_workspace_idx
  ON post_targets (scheduled_at, post_id)
  WHERE status = 'pending' AND scheduled_at IS NOT NULL;

CREATE FUNCTION bump_workspace_stats_version() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE affected_workspace_id text;
BEGIN
  affected_workspace_id := COALESCE(NEW.workspace_id, OLD.workspace_id);
  UPDATE workspaces SET stats_version = stats_version + 1
    WHERE id = affected_workspace_id;
  IF TG_OP = 'UPDATE' AND OLD.workspace_id IS DISTINCT FROM NEW.workspace_id THEN
    UPDATE workspaces SET stats_version = stats_version + 1
      WHERE id = OLD.workspace_id;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER posts_bump_workspace_stats_version
  AFTER INSERT OR UPDATE OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION bump_workspace_stats_version();

CREATE FUNCTION bump_post_target_workspace_stats_version() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE affected_post_id text;
BEGIN
  affected_post_id := COALESCE(NEW.post_id, OLD.post_id);
  UPDATE workspaces SET stats_version = stats_version + 1
    WHERE id = (SELECT workspace_id FROM posts WHERE id = affected_post_id);
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER post_targets_bump_workspace_stats_version
  AFTER INSERT OR UPDATE OR DELETE ON post_targets
  FOR EACH ROW EXECUTE FUNCTION bump_post_target_workspace_stats_version();

CREATE TYPE quota_reservation_status AS ENUM ('pending', 'committed', 'released', 'expired');

CREATE TABLE quota_reservations (
  id text PRIMARY KEY,
  billing_owner_user_id text NOT NULL REFERENCES users(id),
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  resource text NOT NULL CHECK (resource IN (
    'socialAccounts', 'monthlyPosts', 'mediaStorageBytes',
    'apiRequestsPerMonth', 'dmsSent', 'transcriptionsUsed'
  )),
  amount bigint NOT NULL CHECK (amount > 0),
  status quota_reservation_status NOT NULL DEFAULT 'pending',
  idempotency_key text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  committed_at timestamptz,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quota_reservations_owner_pending_idx
  ON quota_reservations (billing_owner_user_id, resource, expires_at)
  WHERE status = 'pending';

CREATE TYPE billing_transfer_status AS ENUM ('pending', 'accepted', 'cancelled', 'expired');

CREATE TABLE billing_owner_transfers (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  from_user_id text NOT NULL REFERENCES users(id),
  to_user_id text NOT NULL REFERENCES users(id),
  requested_by_user_id text NOT NULL REFERENCES users(id),
  status billing_transfer_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (from_user_id <> to_user_id)
);
CREATE UNIQUE INDEX billing_owner_transfers_one_pending_idx
  ON billing_owner_transfers (workspace_id)
  WHERE status = 'pending';
CREATE INDEX billing_owner_transfers_target_idx
  ON billing_owner_transfers (to_user_id, status, expires_at);

CREATE TABLE billing_webhook_events (
  provider_event_id text PRIMARY KEY,
  event_type text NOT NULL,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER quota_reservations_set_updated_at BEFORE UPDATE ON quota_reservations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER billing_owner_transfers_set_updated_at BEFORE UPDATE ON billing_owner_transfers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
