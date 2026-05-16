-- ============================================================
-- Nexus CDP Database Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------
-- Profiles — one row per unified customer identity
-- ----------------------------------------------------------------
CREATE TABLE profiles (
  profile_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  traits        JSONB NOT NULL DEFAULT '{}',
  segments      TEXT[] NOT NULL DEFAULT '{}',
  event_count   INTEGER NOT NULL DEFAULT 0,
  first_seen    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- Identity resolution tables — multiple identifiers → one profile
-- ----------------------------------------------------------------
CREATE TABLE profile_fingerprints (
  fingerprint  TEXT PRIMARY KEY,
  profile_id   UUID NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  linked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profile_user_ids (
  user_id      TEXT PRIMARY KEY,
  profile_id   UUID NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  linked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profile_device_ids (
  device_id    TEXT PRIMARY KEY,
  profile_id   UUID NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  linked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- Events
-- ----------------------------------------------------------------
CREATE TABLE events (
  event_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID REFERENCES profiles(profile_id) ON DELETE SET NULL,
  fingerprint  TEXT,
  user_id      TEXT,
  device_id    TEXT,
  source       TEXT NOT NULL CHECK (source IN ('web', 'mobile', 'api', 'iot', 'pos')),
  source_app   TEXT NOT NULL,
  type         TEXT NOT NULL,
  properties   JSONB NOT NULL DEFAULT '{}',
  context      JSONB NOT NULL DEFAULT '{}',
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ingested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_profile_id   ON events(profile_id);
CREATE INDEX idx_events_fingerprint  ON events(fingerprint);
CREATE INDEX idx_events_user_id      ON events(user_id);
CREATE INDEX idx_events_device_id    ON events(device_id);
CREATE INDEX idx_events_type         ON events(type);
CREATE INDEX idx_events_occurred_at  ON events(occurred_at DESC);
CREATE INDEX idx_events_source_app   ON events(source_app);

-- ----------------------------------------------------------------
-- Signals
-- ----------------------------------------------------------------
CREATE TABLE signals (
  signal_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL UNIQUE,
  description         TEXT NOT NULL DEFAULT '',
  time_window_seconds INTEGER,          -- NULL = no time constraint
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE signal_rules (
  rule_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id   UUID NOT NULL REFERENCES signals(signal_id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  min_count   INTEGER NOT NULL DEFAULT 1,
  conditions  JSONB NOT NULL DEFAULT '{}',  -- property filters
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------------
-- Signal Firings — audit log of every time a signal fired
-- ----------------------------------------------------------------
CREATE TABLE signal_firings (
  firing_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id      UUID NOT NULL REFERENCES signals(signal_id) ON DELETE CASCADE,
  profile_id     UUID NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  matched_events UUID[] NOT NULL DEFAULT '{}',
  fired_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signal_firings_signal_id   ON signal_firings(signal_id);
CREATE INDEX idx_signal_firings_profile_id  ON signal_firings(profile_id);
CREATE INDEX idx_signal_firings_fired_at    ON signal_firings(fired_at DESC);

-- ----------------------------------------------------------------
-- Webhook Subscriptions
-- ----------------------------------------------------------------
CREATE TABLE webhook_subscriptions (
  subscription_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id        UUID NOT NULL REFERENCES signals(signal_id) ON DELETE CASCADE,
  target_url       TEXT NOT NULL,
  secret           TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  delivery_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id  UUID NOT NULL REFERENCES webhook_subscriptions(subscription_id) ON DELETE CASCADE,
  firing_id        UUID NOT NULL REFERENCES signal_firings(firing_id) ON DELETE CASCADE,
  status_code      INTEGER,
  success          BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_body    TEXT
);

CREATE INDEX idx_webhook_deliveries_sub_id ON webhook_deliveries(subscription_id);
