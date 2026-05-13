-- Switch seed image paths from beauty-salon JPGs to Bravo barbershop SVGs.
-- Only updates rows that still reference the old paths (so admin-edited rows
-- with custom images are untouched).

UPDATE services SET image = '/assets/svc-haircut.svg'  WHERE image = '/assets/svc-manicure.jpg' AND category = 'haircut';
UPDATE services SET image = '/assets/svc-haircut.svg'  WHERE id = 's1';
UPDATE services SET image = '/assets/svc-haircut.svg'  WHERE id = 's2';
UPDATE services SET image = '/assets/svc-beard.svg'    WHERE id = 's3';
UPDATE services SET image = '/assets/svc-shave.svg'    WHERE id = 's4';
UPDATE services SET image = '/assets/svc-kids.svg'     WHERE id = 's5';
UPDATE services SET image = '/assets/svc-coloring.svg' WHERE id = 's6';
UPDATE services SET image = '/assets/svc-styling.svg'  WHERE id = 's7';
UPDATE services SET image = '/assets/svc-combo.svg'    WHERE id = 's8';

UPDATE masters SET image = '/assets/master-1.svg' WHERE id = 'm1' AND image = '/assets/master-1.jpg';
UPDATE masters SET image = '/assets/master-2.svg' WHERE id = 'm2' AND image = '/assets/master-2.jpg';
UPDATE masters SET image = '/assets/master-3.svg' WHERE id = 'm3' AND image = '/assets/master-3.jpg';

UPDATE branches SET image = '/assets/branch-barbershop.svg' WHERE image = '/assets/branch-1.jpg';

UPDATE promos SET image = '/assets/promo-1.svg' WHERE image = '/assets/promo-1.jpg';
UPDATE promos SET image = '/assets/promo-2.svg' WHERE image = '/assets/promo-2.jpg';
