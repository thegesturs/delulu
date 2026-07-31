ALTER TABLE post_targets
ADD COLUMN provider_state jsonb NOT NULL DEFAULT '{}'::jsonb;
