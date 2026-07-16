-- Normalize billing into one base subscription with zero or more add-ons.

CREATE TABLE subscription_addons (
  id text PRIMARY KEY,
  legacy_convex_id text UNIQUE,
  base_subscription_id text NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  addon_key text NOT NULL,
  provider_subscription_id text UNIQUE,
  status text NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  provider_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (base_subscription_id, addon_key)
);

CREATE INDEX subscription_addons_status_idx
  ON subscription_addons (base_subscription_id, status);

CREATE TRIGGER subscription_addons_set_updated_at
  BEFORE UPDATE ON subscription_addons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION pg_temp.is_billing_addon_product(value text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT value IN (
    'pdt_0NYbkcEzkjqKXheG8mvVT',
    'pdt_0NaHY46JcpB8ELVhB3zVh'
  )
$$;

-- Capture the strongest add-on state before repairing a base row that an old
-- webhook overwrote. Prefer the normalized JSON state when it is newer.
WITH addon_candidates AS (
  SELECT
    s.id AS base_subscription_id,
    s.billing_owner_user_id,
    s.addons->'sorted'->>'legacyConvexId' AS legacy_convex_id,
    s.addons->'sorted'->>'providerSubscriptionId' AS provider_subscription_id,
    COALESCE(s.addons->'sorted'->>'status', 'active') AS status,
    CASE WHEN pg_input_is_valid(
      s.addons->'sorted'->>'currentPeriodStart', 'timestamp with time zone'
    ) THEN (s.addons->'sorted'->>'currentPeriodStart')::timestamptz END AS current_period_start,
    CASE WHEN pg_input_is_valid(
      s.addons->'sorted'->>'currentPeriodEnd', 'timestamp with time zone'
    ) THEN (s.addons->'sorted'->>'currentPeriodEnd')::timestamptz END AS current_period_end,
    COALESCE(
      CASE WHEN lower(s.addons->'sorted'->>'cancelAtPeriodEnd') IN ('true', 'false')
        THEN (s.addons->'sorted'->>'cancelAtPeriodEnd')::boolean END,
      false
    ) AS cancel_at_period_end,
    CASE WHEN pg_input_is_valid(
      s.addons->'sorted'->>'providerUpdatedAt', 'timestamp with time zone'
    ) THEN (s.addons->'sorted'->>'providerUpdatedAt')::timestamptz END AS provider_updated_at,
    2 AS source_priority
  FROM subscriptions s
  WHERE s.addons->'sorted' IS NOT NULL

  UNION ALL

  SELECT
    s.id,
    s.billing_owner_user_id,
    s.legacy_convex_id,
    s.provider_subscription_id,
    s.status,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.provider_updated_at,
    1
  FROM subscriptions s
  WHERE pg_temp.is_billing_addon_product(s.plan)
), selected_addons AS (
  SELECT DISTINCT ON (base_subscription_id)
    base_subscription_id,
    billing_owner_user_id,
    legacy_convex_id,
    provider_subscription_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    provider_updated_at
  FROM addon_candidates
  ORDER BY base_subscription_id, provider_updated_at DESC NULLS LAST, source_priority DESC
)
INSERT INTO subscription_addons (
  id,
  legacy_convex_id,
  base_subscription_id,
  addon_key,
  provider_subscription_id,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  provider_updated_at
)
SELECT
  'subscription_addon_' || md5(billing_owner_user_id || ':sorted'),
  legacy_convex_id,
  base_subscription_id,
  'sorted',
  provider_subscription_id,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  provider_updated_at
FROM selected_addons;

-- Recover the latest authoritative base-plan event when an add-on webhook
-- overwrote the base row.
WITH normalized_base_event AS (
  SELECT
    payload->>'billingOwnerUserId' AS billing_owner_user_id,
    payload,
    CASE WHEN pg_input_is_valid(
      payload->>'providerOccurredAt', 'timestamp with time zone'
    ) THEN (payload->>'providerOccurredAt')::timestamptz END AS provider_occurred_at,
    applied_at
  FROM billing_webhook_events
  WHERE payload->>'_tag' = 'SubscriptionChanged'
    AND upper(payload->>'plan') IN ('ECHO', 'VIBE')
), latest_base_event AS (
  SELECT DISTINCT ON (billing_owner_user_id)
    billing_owner_user_id,
    payload,
    provider_occurred_at
  FROM normalized_base_event
  ORDER BY billing_owner_user_id, provider_occurred_at DESC NULLS LAST, applied_at DESC
)
UPDATE subscriptions AS subscription
SET legacy_convex_id = NULL,
    provider_customer_id = COALESCE(
      NULLIF(base.payload->>'providerCustomerId', ''),
      subscription.provider_customer_id
    ),
    provider_subscription_id = NULLIF(base.payload->>'providerSubscriptionId', ''),
    plan = upper(base.payload->>'plan'),
    status = base.payload->>'status',
    current_period_start = CASE WHEN pg_input_is_valid(
      base.payload->>'currentPeriodStart', 'timestamp with time zone'
    ) THEN (base.payload->>'currentPeriodStart')::timestamptz END,
    current_period_end = CASE WHEN pg_input_is_valid(
      base.payload->>'currentPeriodEnd', 'timestamp with time zone'
    ) THEN (base.payload->>'currentPeriodEnd')::timestamptz END,
    billing_interval = NULLIF(base.payload->>'billingInterval', ''),
    currency = NULLIF(base.payload->>'currency', ''),
    recurring_amount_minor = CASE WHEN pg_input_is_valid(
      base.payload->>'recurringAmountMinor', 'bigint'
    ) THEN (base.payload->>'recurringAmountMinor')::bigint END,
    cancel_at_period_end = COALESCE(
      CASE WHEN lower(base.payload->>'cancelAtPeriodEnd') IN ('true', 'false')
        THEN (base.payload->>'cancelAtPeriodEnd')::boolean END,
      false
    ),
    provider_updated_at = base.provider_occurred_at
FROM latest_base_event AS base
WHERE subscription.billing_owner_user_id = base.billing_owner_user_id
  AND pg_temp.is_billing_addon_product(subscription.plan);

-- If local history cannot prove the previous paid tier, retain the row and all
-- usage as the owner's base subscription but fall back to FREE. A fresh base
-- webhook can then restore the authoritative tier without manual data edits.
UPDATE subscriptions
SET legacy_convex_id = NULL,
    provider_subscription_id = NULL,
    plan = 'FREE',
    status = 'active',
    current_period_start = NULL,
    current_period_end = NULL,
    billing_interval = NULL,
    currency = NULL,
    recurring_amount_minor = NULL,
    cancel_at_period_end = false,
    provider_updated_at = NULL
WHERE pg_temp.is_billing_addon_product(plan);

ALTER TABLE subscriptions DROP COLUMN addons;
