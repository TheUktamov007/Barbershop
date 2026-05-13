-- Batch 4: gift certificates + service packages (abonements).

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,                -- redemption code (e.g. BRAVO-AB12CD)
  amount_initial INTEGER NOT NULL,          -- in sum
  amount_balance INTEGER NOT NULL,
  owner_tg_id INTEGER,                      -- can be unassigned (gift-card style)
  gifted_by_tg_id INTEGER,                  -- who paid
  note TEXT,
  expires_at TEXT,                          -- YYYY-MM-DD or NULL = no expiry
  status TEXT NOT NULL DEFAULT 'active',    -- active | spent | revoked
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_cert_owner ON certificates(owner_tg_id);
CREATE INDEX IF NOT EXISTS idx_cert_code ON certificates(code);

CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  owner_tg_id INTEGER NOT NULL,
  title TEXT NOT NULL,                      -- e.g. "10 стрижек"
  service_id TEXT,                          -- limit to a specific service (NULL = any)
  category TEXT,                            -- alternatively: any service in this category
  total_visits INTEGER NOT NULL,
  used_visits INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'active',    -- active | depleted | expired | revoked
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_pkg_owner ON packages(owner_tg_id);

-- Track which booking used a cert/package (so we don't double-spend on edits).
ALTER TABLE bookings ADD COLUMN cert_id TEXT;
ALTER TABLE bookings ADD COLUMN cert_amount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN package_id TEXT;
