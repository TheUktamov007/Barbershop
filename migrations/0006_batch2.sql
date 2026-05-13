-- Batch 2: referrals, favorites, master work hours.

ALTER TABLE customers ADD COLUMN favorite_masters TEXT NOT NULL DEFAULT '[]';
-- referral_code: short code generated per user. Friends opening
-- t.me/lumebeauty_bot?start=ref_<code> get tracked.
ALTER TABLE customers ADD COLUMN referral_code TEXT;
CREATE INDEX IF NOT EXISTS idx_customers_ref ON customers(referral_code);

-- JSON: { mon: '10:00-22:00', tue: '...', ..., sun: 'off' }
-- Empty string or "off" = day off.
ALTER TABLE masters ADD COLUMN work_hours TEXT NOT NULL DEFAULT '{}';

-- Broadcast log (audit + idempotency).
CREATE TABLE IF NOT EXISTS broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
