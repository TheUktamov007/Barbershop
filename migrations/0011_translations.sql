-- UZ translations for catalog. When language is "uz" the client uses the _uz
-- field if non-empty, otherwise falls back to the base RU value.

ALTER TABLE services  ADD COLUMN title_uz TEXT;
ALTER TABLE services  ADD COLUMN description_uz TEXT;
ALTER TABLE branches  ADD COLUMN name_uz TEXT;
ALTER TABLE branches  ADD COLUMN address_uz TEXT;
ALTER TABLE branches  ADD COLUMN hours_uz TEXT;
ALTER TABLE masters   ADD COLUMN name_uz TEXT;
ALTER TABLE masters   ADD COLUMN role_uz TEXT;
ALTER TABLE promos    ADD COLUMN title_uz TEXT;
ALTER TABLE promos    ADD COLUMN description_uz TEXT;
ALTER TABLE promos    ADD COLUMN badge_uz TEXT;
ALTER TABLE promos    ADD COLUMN valid_until_uz TEXT;
