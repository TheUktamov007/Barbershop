-- Multi-admin / staff accounts.
-- - role 'super'  = full access, can create/delete other admins and edit catalog.
-- - role 'master' = sees only bookings assigned to their master_id (and receives bot DMs about them).
-- - login + password_hash: SHA-256 hex of UTF-8 password (good enough for staff panel; rotate via super admin).

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  login TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,             -- sha256 hex
  role TEXT NOT NULL DEFAULT 'master',     -- 'super' | 'master'
  master_id TEXT,                          -- FK to masters.id when role='master'
  tg_user_id INTEGER,                      -- if set, bot can DM this user
  display_name TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_admins_login ON admins(login);
CREATE INDEX IF NOT EXISTS idx_admins_master ON admins(master_id);

-- Admin session tokens (so we don't keep password in the browser).
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions(admin_id);
