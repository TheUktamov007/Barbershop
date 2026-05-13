-- Round 4: loyalty / cashback.
-- customers table was created in 0002 — these are tweaks and indexes.

CREATE INDEX IF NOT EXISTS idx_customers_birthday ON customers(birthday);

-- Bonus transaction log: every accrual / spend is recorded for audit.
CREATE TABLE IF NOT EXISTS bonus_txns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tg_user_id INTEGER NOT NULL,
  delta INTEGER NOT NULL,                 -- positive = accrual, negative = spend
  reason TEXT NOT NULL,                   -- 'visit', 'spend', 'birthday', 'referral', etc.
  booking_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_bonus_txns_user ON bonus_txns(tg_user_id);

-- Mark on bookings whether bonuses were already accrued (avoid double-count
-- on status edits).
ALTER TABLE bookings ADD COLUMN bonus_accrued INTEGER NOT NULL DEFAULT 0;

-- Bonus points spent on this booking (deducted from total price).
ALTER TABLE bookings ADD COLUMN bonus_used INTEGER NOT NULL DEFAULT 0;

-- Track which user invited whom (referral source).
ALTER TABLE customers ADD COLUMN referred_by INTEGER;
