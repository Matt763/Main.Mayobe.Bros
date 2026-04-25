/*
  # Create dashboard_settings (singleton config) + password_change_codes

  Adds a single-row JSONB config table that the admin "User Dashboard Management"
  module reads/writes. Public reader hook reads a filtered subset.

  Also adds password_change_codes for the reader password change/reset flow:
  one-time, time-limited 5-character alphanumeric codes (uppercase + digits,
  ambiguous chars stripped), hashed at rest.
*/

-- ── dashboard_settings ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  config jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

INSERT INTO dashboard_settings (id, config) VALUES (
  1,
  '{
    "features": {
      "personalizedFeed": true,
      "savedContent": true,
      "learningSystem": false,
      "jobsTracker": true,
      "notifications": true,
      "userStats": true,
      "aiAssistant": false
    },
    "limits": {
      "freeSavedPostsMax": 10,
      "freeReadingHistoryMax": 100,
      "freeNotificationsPerDay": 5
    },
    "layout": {
      "sectionVisibility": {
        "recommended": true,
        "saved": true,
        "learning": false,
        "jobs": true,
        "notifications": true
      },
      "sectionOrder": ["recommended", "saved", "learning", "jobs", "notifications"]
    },
    "personalization": {
      "recommendationSource": "category",
      "defaultInterestIds": []
    },
    "premium": {
      "enabled": true,
      "priceUsd": 5,
      "currency": "USD",
      "premiumOnlyFeatures": []
    },
    "notifications": {
      "globalEnabled": true
    },
    "jobs": {
      "showOnDashboard": true,
      "featuredJobIds": []
    }
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. unauthenticated) can read — server filters secrets out before exposing.
DROP POLICY IF EXISTS "dashboard_settings_public_read" ON dashboard_settings;
CREATE POLICY "dashboard_settings_public_read"
  ON dashboard_settings FOR SELECT
  USING (true);

-- No insert/update/delete policies = service role only (admin endpoint uses service role).

-- ── password_change_codes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_change_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  code_hash text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('change', 'set', 'reset')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  attempts smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pcc_user_id ON password_change_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_pcc_email ON password_change_codes(email);
CREATE INDEX IF NOT EXISTS idx_pcc_expires_at ON password_change_codes(expires_at);

ALTER TABLE password_change_codes ENABLE ROW LEVEL SECURITY;
-- No public policies — service role only (server endpoints handle access control).
