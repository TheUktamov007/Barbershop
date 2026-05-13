-- Batch 1: admin operations (manual booking, customer notes, no-show, cancel reason).

-- Private admin note about a customer (allergies, preferences, problems).
ALTER TABLE customers ADD COLUMN admin_note TEXT;

-- Why a booking was cancelled (free text picked from a small list on the UI).
ALTER TABLE bookings ADD COLUMN cancel_reason TEXT;

-- Bookings created manually by admin (walk-in / phone). Useful for filters/stats.
ALTER TABLE bookings ADD COLUMN created_by_admin INTEGER NOT NULL DEFAULT 0;
