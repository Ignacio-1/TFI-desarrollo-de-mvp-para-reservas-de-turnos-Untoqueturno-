-- Agrega el estado is_paid a los turnos
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS is_paid boolean not null default false;
