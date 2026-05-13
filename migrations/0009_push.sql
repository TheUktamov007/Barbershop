-- Batch 4b: Web Push subscriptions.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tg_user_id INTEGER,                     -- optional: link to TG user
  endpoint TEXT NOT NULL UNIQUE,          -- subscription endpoint (URL)
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_used_at INTEGER,
  failed_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(tg_user_id);
