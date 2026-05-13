-- Round 5: reviews + extra service photos.

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  tg_user_id INTEGER NOT NULL,
  customer_name TEXT,
  booking_id TEXT NOT NULL,
  master_id TEXT,
  service_id TEXT,
  rating INTEGER NOT NULL,                -- 1..5
  text TEXT,
  status TEXT NOT NULL DEFAULT 'published', -- published | hidden
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_reviews_master ON reviews(master_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews(booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_reviews_booking ON reviews(booking_id);

-- Extra photos for a service (in addition to services.image, which is the cover).
-- JSON array of URLs.
ALTER TABLE services ADD COLUMN gallery TEXT NOT NULL DEFAULT '[]';
