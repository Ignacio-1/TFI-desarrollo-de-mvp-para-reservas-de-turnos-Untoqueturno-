drop type if exists public.subscription_status cascade;
drop type if exists public.business_role cascade;
drop type if exists public.appointment_status cascade;
drop type if exists public.payment_method cascade;
drop type if exists public.payment_status cascade;
drop table if exists public.profiles cascade;
drop table if exists public.businesses cascade;
drop table if exists public.business_roles cascade;
drop table if exists public.services cascade;
drop table if exists public.professionals cascade;
drop table if exists public.professional_hours cascade;
drop table if exists public.appointments cascade;
drop table if exists public.payments cascade;
drop function if exists public.handle_new_user cascade;
drop function if exists public.has_business_role cascade;

-- ============================================================================
-- Un Toque · Esquema inicial multi-tenant
-- ============================================================================

-- ---------- Enums ----------
create type public.subscription_status as enum ('trial', 'active', 'inactive');
create type public.business_role as enum ('owner', 'admin', 'client');
create type public.appointment_status as enum ('pending_payment', 'confirmed', 'cancelled');
create type public.payment_method as enum ('cash', 'mercadopago');
create type public.payment_status as enum ('pending', 'approved', 'rejected');

-- ---------- profiles (extiende auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  is_superadmin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- businesses ----------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  address text,
  primary_color text not null default '#14b8a6',
  logo_emoji text not null default '💈',
  subscription_status public.subscription_status not null default 'trial',
  created_at timestamptz not null default now()
);

-- ---------- business_roles ----------
create table public.business_roles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.business_role not null,
  unique (business_id, user_id, role)
);

-- ---------- services ----------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  duration_min int not null default 30,
  price numeric(12,2) not null default 0,
  deposit numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- professionals ----------
create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  title text,
  avatar_color text not null default '#14b8a6',
  service_ids uuid[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- professional_hours ----------
create table public.professional_hours (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6), -- 0 = domingo
  start_time time not null,
  end_time time not null,
  unique (professional_id, weekday)
);

-- ---------- appointments ----------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  client_id uuid references auth.users(id) on delete set null,
  client_name text not null,
  client_email text,
  client_phone text,
  date date not null,
  time time not null,
  status public.appointment_status not null default 'pending_payment',
  created_at timestamptz not null default now()
);
create index appointments_business_date_idx on public.appointments (business_id, date);
create index appointments_pending_idx on public.appointments (status, created_at);

-- ---------- payments ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  method public.payment_method not null,
  status public.payment_status not null default 'pending',
  amount numeric(12,2) not null,
  mp_preference_id text,
  mp_payment_id text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Función security definer: ¿el usuario tiene un rol en el negocio?
-- ============================================================================
create or replace function public.has_business_role(_business_id uuid, _roles public.business_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_roles
    where business_id = _business_id
      and user_id = auth.uid()
      and role = any(_roles)
  );
$$;

-- ============================================================================
-- Trigger: crear profile al registrarse
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- GRANTS (obligatorio en Supabase para la Data API)
-- ============================================================================
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

grant select on public.businesses to anon;            -- landing pública del negocio
grant select, insert, update, delete on public.businesses to authenticated;
grant all on public.businesses to service_role;

grant select, insert, update, delete on public.business_roles to authenticated;
grant all on public.business_roles to service_role;

grant select on public.services to anon;              -- visibles en la landing
grant select, insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;

grant select on public.professionals to anon;
grant select, insert, update, delete on public.professionals to authenticated;
grant all on public.professionals to service_role;

grant select on public.professional_hours to anon;
grant select, insert, update, delete on public.professional_hours to authenticated;
grant all on public.professional_hours to service_role;

grant select, insert, update, delete on public.appointments to authenticated;
grant all on public.appointments to service_role;

grant select, insert, update, delete on public.payments to authenticated;
grant all on public.payments to service_role;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_roles enable row level security;
alter table public.services enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_hours enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;

-- profiles
create policy "profiles: ver el propio" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles: editar el propio" on public.profiles
  for update to authenticated using (id = auth.uid());

-- businesses
create policy "businesses: lectura pública" on public.businesses
  for select using (true);
create policy "businesses: crear (autenticado)" on public.businesses
  for insert to authenticated with check (true);
create policy "businesses: editar (owner/admin)" on public.businesses
  for update to authenticated using (public.has_business_role(id, array['owner','admin']::public.business_role[]));

-- business_roles
create policy "business_roles: ver propios" on public.business_roles
  for select to authenticated using (user_id = auth.uid());
create policy "business_roles: alta inicial owner" on public.business_roles
  for insert to authenticated with check (user_id = auth.uid());

-- services (lectura pública, escritura owner/admin)
create policy "services: lectura pública" on public.services
  for select using (true);
create policy "services: gestionar (owner/admin)" on public.services
  for all to authenticated
  using (public.has_business_role(business_id, array['owner','admin']::public.business_role[]))
  with check (public.has_business_role(business_id, array['owner','admin']::public.business_role[]));

-- professionals
create policy "professionals: lectura pública" on public.professionals
  for select using (true);
create policy "professionals: gestionar (owner/admin)" on public.professionals
  for all to authenticated
  using (public.has_business_role(business_id, array['owner','admin']::public.business_role[]))
  with check (public.has_business_role(business_id, array['owner','admin']::public.business_role[]));

-- professional_hours
create policy "hours: lectura pública" on public.professional_hours
  for select using (true);
create policy "hours: gestionar (owner/admin)" on public.professional_hours
  for all to authenticated
  using (exists (
    select 1 from public.professionals p
    where p.id = professional_id
      and public.has_business_role(p.business_id, array['owner','admin']::public.business_role[])
  ))
  with check (exists (
    select 1 from public.professionals p
    where p.id = professional_id
      and public.has_business_role(p.business_id, array['owner','admin']::public.business_role[])
  ));

-- appointments
create policy "appointments: cliente ve los suyos" on public.appointments
  for select to authenticated using (client_id = auth.uid());
create policy "appointments: staff ve los del negocio" on public.appointments
  for select to authenticated using (public.has_business_role(business_id, array['owner','admin']::public.business_role[]));
create policy "appointments: cliente crea el suyo" on public.appointments
  for insert to authenticated with check (client_id = auth.uid());
create policy "appointments: cliente cancela el suyo" on public.appointments
  for update to authenticated using (client_id = auth.uid());
create policy "appointments: staff gestiona" on public.appointments
  for update to authenticated using (public.has_business_role(business_id, array['owner','admin']::public.business_role[]));

-- payments
create policy "payments: cliente ve los suyos" on public.payments
  for select to authenticated using (exists (
    select 1 from public.appointments a where a.id = appointment_id and a.client_id = auth.uid()
  ));
create policy "payments: cliente crea" on public.payments
  for insert to authenticated with check (exists (
    select 1 from public.appointments a where a.id = appointment_id and a.client_id = auth.uid()
  ));
create policy "payments: staff ve" on public.payments
  for select to authenticated using (exists (
    select 1 from public.appointments a
    where a.id = appointment_id
      and public.has_business_role(a.business_id, array['owner','admin']::public.business_role[])
  ));

