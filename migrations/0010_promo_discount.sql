-- Promos can now carry a real discount %. When a customer enters the booking
-- flow via a promo card, the discount is applied to matching services.

ALTER TABLE promos ADD COLUMN discount_pct INTEGER NOT NULL DEFAULT 0;
-- JSON array of service ids this promo applies to. Empty/[] = any service.
ALTER TABLE promos ADD COLUMN service_ids TEXT NOT NULL DEFAULT '[]';

-- Track which promo was used on a booking.
ALTER TABLE bookings ADD COLUMN promo_id TEXT;
ALTER TABLE bookings ADD COLUMN promo_discount INTEGER NOT NULL DEFAULT 0;
