-- Batch 3: master commissions + review moderation + multi-admin support.

-- Commission % the master takes from each completed service price.
ALTER TABLE masters ADD COLUMN commission_pct REAL NOT NULL DEFAULT 40;

-- Reviews already have status (published|hidden). Add admin_reply column.
ALTER TABLE reviews ADD COLUMN admin_reply TEXT;
ALTER TABLE reviews ADD COLUMN replied_at INTEGER;
