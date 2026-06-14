-- ============================================================================
-- Datos de ejemplo (opcional). Ejecutar DESPUÉS de crear un negocio.
-- Reemplazá el slug si usaste otro.
-- ============================================================================
do $$
declare
  biz uuid;
  martin uuid;
  lucia uuid;
  corte uuid;
  barba uuid;
begin
  select id into biz from public.businesses where slug = 'barberia-juan' limit 1;
  if biz is null then
    raise notice 'No existe el negocio. Creá uno desde /crear-negocio primero.';
    return;
  end if;

  insert into public.services (business_id, name, description, duration_min, price, deposit)
  values
    (biz, 'Corte de cabello', 'Corte clásico o moderno con lavado.', 30, 6000, 2000),
    (biz, 'Corte + Barba', 'Corte completo y perfilado de barba.', 45, 9000, 3000)
  returning id into corte;

  select id into corte from public.services where business_id = biz and name = 'Corte de cabello';
  select id into barba from public.services where business_id = biz and name = 'Corte + Barba';

  insert into public.professionals (business_id, name, title, avatar_color, service_ids)
  values (biz, 'Martín Gómez', 'Barbero senior', '#14b8a6', array[corte, barba])
  returning id into martin;

  insert into public.professionals (business_id, name, title, avatar_color, service_ids)
  values (biz, 'Lucía Fernández', 'Estilista', '#8b5cf6', array[corte])
  returning id into lucia;

  -- Horarios lun-vie 09-18 para ambos
  insert into public.professional_hours (professional_id, weekday, start_time, end_time)
  select p.id, wd, '09:00', '18:00'
  from (values (martin), (lucia)) as p(id),
       generate_series(1, 5) as wd;
end $$;
