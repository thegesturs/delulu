ALTER TABLE automations
  ADD COLUMN external_submission_id text;

CREATE UNIQUE INDEX automations_external_submission_idx
  ON automations (workspace_id, external_submission_id)
  WHERE external_submission_id IS NOT NULL;

CREATE TABLE automation_comment_dispatches (
  provider text NOT NULL,
  event_id text NOT NULL,
  automation_id text NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  status text NOT NULL,
  response_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, event_id, automation_id)
);

UPDATE automations
SET triggers = COALESCE(
  (
    SELECT jsonb_agg(
      trigger || jsonb_build_object(
        'targetMode',
        COALESCE(
          trigger->>'targetMode',
          CASE
            WHEN jsonb_array_length(
              COALESCE(trigger->'targetPostIds', '[]'::jsonb)
            ) = 0 AND jsonb_array_length(
              COALESCE(trigger->'pendingPostIds', '[]'::jsonb)
            ) = 0
            THEN 'all'
            ELSE 'specific'
          END
        )
      )
    )
    FROM jsonb_array_elements(automations.triggers) AS trigger
  ),
  '[]'::jsonb
)
WHERE jsonb_array_length(triggers) > 0;

INSERT INTO automation_trigger_index (
  automation_id,
  connection_id,
  profile_id,
  media_id,
  enabled
)
SELECT DISTINCT
  automations.id,
  automations.connection_id,
  connections.profile_id,
  '*',
  automations.enabled
FROM automations
JOIN connections ON connections.id = automations.connection_id
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(automations.triggers) AS trigger
  WHERE trigger->>'targetMode' = 'all'
)
ON CONFLICT (automation_id, media_id)
DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = now();

INSERT INTO automation_trigger_repairs (profile_id, media_id)
SELECT DISTINCT connections.profile_id, '*'
FROM automations
JOIN connections ON connections.id = automations.connection_id
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(automations.triggers) AS trigger
  WHERE trigger->>'targetMode' = 'all'
)
ON CONFLICT (profile_id, media_id)
DO UPDATE SET requested_at = now();
