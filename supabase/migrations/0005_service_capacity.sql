-- Agrega la columna capacity a la tabla services
ALTER TABLE public.services ADD COLUMN capacity int not null default 1;
