-- D1 schema: bookings + slot locks.
-- Catalog tables (services/branches/masters/promos) stay in mock.ts for Round 1
-- and will move into D1 in Round 2 once assets are in /public.

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  tg_user_id INTEGER,
  customer_name TEXT,
  customer_username TEXT,
  service_title TEXT NOT NULL,
  service_ids TEXT,                       -- JSON array of selected service ids
  master_id TEXT,
  master_name TEXT NOT NULL,
  branch_id TEXT,
  branch_name TEXT NOT NULL,
  start_at TEXT NOT NULL,                 -- ISO datetime ("YYYY-MM-DDTHH:mm:ss")
  duration_min INTEGER NOT NULL,
  price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',-- upcoming|confirmed|completed|cancelled
  reminder_24h_sent INTEGER NOT NULL DEFAULT 0,
  reminder_2h_sent INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_bookings_tg_user ON bookings(tg_user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_at ON bookings(start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Slot lock: prevents two clients from booking the same time.
CREATE TABLE IF NOT EXISTS slot_locks (
  key TEXT PRIMARY KEY,                   -- "branchId|masterId|YYYY-MM-DD|HH:mm"
  session_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL             -- unix seconds
);

CREATE INDEX IF NOT EXISTS idx_slot_locks_expires ON slot_locks(expires_at);
