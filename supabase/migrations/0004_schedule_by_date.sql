TRUNCATE TABLE professional_hours;
ALTER TABLE professional_hours DROP CONSTRAINT IF EXISTS professional_hours_professional_id_weekday_key;
ALTER TABLE professional_hours DROP COLUMN weekday;
ALTER TABLE professional_hours ADD COLUMN date date NOT NULL;
