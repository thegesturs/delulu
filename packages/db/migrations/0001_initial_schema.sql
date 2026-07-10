CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
CREATE TYPE post_status AS ENUM ('draft', 'pending_review', 'changes_requested', 'scheduled', 'publishing', 'published', 'partially_failed', 'failed');
CREATE TYPE post_source AS ENUM ('app', 'api', 'automation');
CREATE TYPE target_status AS ENUM ('pending', 'publishing', 'published', 'failed');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE media_status AS ENUM ('pending', 'ready', 'failed');

CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$;

CREATE TABLE users (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  external_id text NOT NULL UNIQUE, email text, name text, image_url text,
  monthly_posts bigint NOT NULL DEFAULT 0, monthly_posts_period_start timestamptz,
  dms_sent bigint NOT NULL DEFAULT 0, dms_sent_period_start timestamptz,
  transcriptions_used bigint NOT NULL DEFAULT 0, transcriptions_period_start timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE workspaces (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  name text NOT NULL, slug text UNIQUE, billing_owner_user_id text NOT NULL REFERENCES users(id),
  parent_org_id text REFERENCES workspaces(id), clerk_org_id text UNIQUE, is_personal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE workspace_members (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, role workspace_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE connections (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  platform text NOT NULL, profile_id text NOT NULL, username text, display_name text,
  access_token text NOT NULL, refresh_token text, cipher_version text NOT NULL DEFAULT 'v1' CHECK (cipher_version = 'v1'),
  expires_at timestamptz, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, profile_id)
);

CREATE TABLE media (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  bucket_key text NOT NULL, url text NOT NULL, media_type text NOT NULL, mime_type text,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0), width integer, height integer,
  duration_seconds double precision, thumbnails jsonb NOT NULL DEFAULT '[]'::jsonb, alt_text text, status media_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE posts (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, status post_status NOT NULL,
  content jsonb NOT NULL, created_by_member_id text NOT NULL REFERENCES workspace_members(id), source post_source NOT NULL,
  external_submission_id text, deleted_at timestamptz, published_at timestamptz,
  search_text tsvector GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, content::text)) STORED,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, external_submission_id),
  CHECK (jsonb_typeof(content -> 'groups') = 'array' AND jsonb_array_length(content -> 'groups') >= 1),
  CHECK (jsonb_array_length(jsonb_path_query_array(content, '$.groups[*] ? (@.isDefault == true)')) = 1)
);
CREATE INDEX posts_search_idx ON posts USING gin(search_text);

CREATE TABLE post_targets (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  post_id text NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  connection_id text NOT NULL REFERENCES connections(id), group_id text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb, scheduled_at timestamptz, status target_status NOT NULL,
  platform_post_id text, platform_post_url text, posted_at timestamptz, error text, attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, connection_id)
);
CREATE INDEX post_targets_schedule_idx ON post_targets(status, scheduled_at) WHERE scheduled_at IS NOT NULL;

CREATE TABLE api_keys (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by_member_id text NOT NULL REFERENCES workspace_members(id), name text NOT NULL,
  key_prefix text NOT NULL UNIQUE, key_hash text NOT NULL UNIQUE, last_used_at timestamptz,
  expires_at timestamptz, revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  billing_owner_user_id text NOT NULL UNIQUE REFERENCES users(id), provider_customer_id text UNIQUE,
  provider_subscription_id text UNIQUE, plan text NOT NULL, status text NOT NULL,
  current_period_start timestamptz, current_period_end timestamptz,
  monthly_posts bigint NOT NULL DEFAULT 0, media_storage_bytes bigint NOT NULL DEFAULT 0,
  dms_sent bigint NOT NULL DEFAULT 0, dms_skipped bigint NOT NULL DEFAULT 0, transcriptions_used bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  billing_owner_user_id text NOT NULL REFERENCES users(id), provider_transaction_id text NOT NULL UNIQUE,
  amount_minor bigint NOT NULL, currency text NOT NULL, status text NOT NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE post_reviews (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  post_id text NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE, status review_status NOT NULL,
  content_fingerprint text NOT NULL, submitted_by_member_id text NOT NULL REFERENCES workspace_members(id),
  resolved_by_member_id text REFERENCES workspace_members(id), resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE review_activity (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  post_id text NOT NULL REFERENCES posts(id) ON DELETE CASCADE, review_id text REFERENCES post_reviews(id) ON DELETE SET NULL,
  actor_member_id text NOT NULL REFERENCES workspace_members(id), activity_type text NOT NULL,
  comment text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE automations (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  connection_id text NOT NULL REFERENCES connections(id), platform text NOT NULL, category text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb, enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE automation_runs (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  automation_id text NOT NULL REFERENCES automations(id) ON DELETE CASCADE, status text NOT NULL,
  input jsonb NOT NULL DEFAULT '{}'::jsonb, output jsonb NOT NULL DEFAULT '{}'::jsonb, error text,
  started_at timestamptz NOT NULL, completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE automation_contacts (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  automation_id text NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  platform_user_id text NOT NULL, email text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (automation_id, platform_user_id)
);

CREATE TABLE transcriptions (
  id text PRIMARY KEY, legacy_convex_id text UNIQUE,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  media_id text REFERENCES media(id) ON DELETE SET NULL, text text NOT NULL, language text,
  duration_seconds double precision,
  search_text tsvector GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, text)) STORED,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transcriptions_search_idx ON transcriptions USING gin(search_text);

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['users','workspaces','workspace_members','connections','media','posts','post_targets','api_keys','subscriptions','transactions','post_reviews','review_activity','automations','automation_runs','automation_contacts','transcriptions']
  LOOP
    EXECUTE format('CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', table_name, table_name);
  END LOOP;
END
$$;
