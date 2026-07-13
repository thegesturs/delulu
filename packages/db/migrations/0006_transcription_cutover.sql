ALTER TABLE transcriptions
  ADD COLUMN reel_id text,
  ADD COLUMN reel_url text,
  ADD COLUMN alt_text text;

ALTER TABLE subscriptions
  ADD COLUMN transcriptions_period_start timestamptz;

CREATE INDEX transcriptions_reel_id_idx
  ON transcriptions (reel_id)
  WHERE reel_id IS NOT NULL;

CREATE UNIQUE INDEX transcriptions_workspace_reel_id_idx
  ON transcriptions (workspace_id, reel_id)
  WHERE reel_id IS NOT NULL;
