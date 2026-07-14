-- Paid lifecycle messaging, cancellation retention, and recoverable expiry.

ALTER TABLE users ADD COLUMN last_active_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE subscriptions
  ADD COLUMN billing_interval text,
  ADD COLUMN currency text,
  ADD COLUMN recurring_amount_minor bigint,
  ADD COLUMN cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN last_renewed_at timestamptz,
  ADD COLUMN paid_since timestamptz,
  ADD COLUMN provider_updated_at timestamptz;

CREATE TABLE email_preferences (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  product_lifecycle_enabled boolean NOT NULL DEFAULT true,
  marketing_enabled boolean NOT NULL DEFAULT false,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE message_deliveries (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  idempotency_key text NOT NULL UNIQUE,
  channel text NOT NULL CHECK (channel IN ('transactional', 'lifecycle')),
  message_type text NOT NULL,
  provider text NOT NULL,
  status text NOT NULL CHECK (status IN ('queued', 'leased', 'sent', 'failed', 'dead', 'suppressed')),
  payload jsonb NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider_message_id text,
  provider_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  suppression_reason text,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 72,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX message_deliveries_due_idx
  ON message_deliveries (next_attempt_at, created_at)
  WHERE status IN ('queued', 'failed');
CREATE INDEX message_deliveries_user_created_idx
  ON message_deliveries (user_id, created_at DESC);

CREATE TYPE cancellation_status AS ENUM (
  'open', 'call_booked', 'offer_accepted', 'scheduled', 'effective',
  'reactivated', 'deleting', 'deleted', 'abandoned'
);

CREATE TABLE cancellation_requests (
  id text PRIMARY KEY,
  billing_owner_user_id text NOT NULL REFERENCES users(id),
  provider_subscription_id text NOT NULL,
  status cancellation_status NOT NULL DEFAULT 'open',
  reason text NOT NULL CHECK (reason IN (
    'too_expensive', 'missing_features', 'switched_service', 'unused',
    'customer_service', 'low_quality', 'too_complex', 'other'
  )),
  comment text CHECK (comment IS NULL OR char_length(comment) <= 1000),
  impact jsonb NOT NULL DEFAULT '{}'::jsonb,
  reference_hash text NOT NULL UNIQUE,
  reference_expires_at timestamptz NOT NULL,
  calendar_booking_uid text UNIQUE,
  calendar_booking_at timestamptz,
  calendar_attendee_email text,
  save_offer_accepted boolean NOT NULL DEFAULT false,
  offer_amount_minor bigint,
  offer_currency text,
  provider_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for timestamptz,
  data_deletion_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX cancellation_requests_one_active_owner_idx
  ON cancellation_requests (billing_owner_user_id)
  WHERE status IN ('open', 'call_booked', 'offer_accepted', 'scheduled', 'effective', 'deleting');
CREATE UNIQUE INDEX cancellation_requests_one_offer_owner_idx
  ON cancellation_requests (billing_owner_user_id)
  WHERE save_offer_accepted = true;
CREATE INDEX cancellation_requests_expiry_idx
  ON cancellation_requests (data_deletion_at)
  WHERE status IN ('scheduled', 'effective', 'deleting');

CREATE TABLE cancellation_recipients (
  cancellation_request_id text NOT NULL REFERENCES cancellation_requests(id) ON DELETE CASCADE,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  email text NOT NULL,
  workspace_names text[] NOT NULL DEFAULT '{}',
  is_payer boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cancellation_request_id, email)
);

CREATE TRIGGER email_preferences_set_updated_at BEFORE UPDATE ON email_preferences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER message_deliveries_set_updated_at BEFORE UPDATE ON message_deliveries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER cancellation_requests_set_updated_at BEFORE UPDATE ON cancellation_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
