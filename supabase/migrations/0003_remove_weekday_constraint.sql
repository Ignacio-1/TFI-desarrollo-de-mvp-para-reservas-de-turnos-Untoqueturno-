-- Eliminar restricción de horario único por día
ALTER TABLE professional_hours 
DROP CONSTRAINT IF EXISTS professional_hours_professional_id_weekday_key;
