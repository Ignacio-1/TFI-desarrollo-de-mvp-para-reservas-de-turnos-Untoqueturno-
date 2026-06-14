-- Esquema Inicial para TurnosApp (SaaS Multi-tenant)

-- 1. Tabla de Negocios
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  logo_url text,
  business_address text,
  phone text,
  primary_color text DEFAULT '#173a40',
  cancellation_policy_hours int DEFAULT 24,
  is_solo_practice boolean DEFAULT true,
  subscription_status text DEFAULT 'trial',
  trial_ends_at timestamp with time zone,
  mp_subscription_id text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Perfiles de Usuarios (Extendiendo Auth)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  is_super_admin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Roles en los Negocios (Multi-tenant)
CREATE TABLE public.business_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'client')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- 4. Servicios
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_minutes int NOT NULL,
  price numeric NOT NULL,
  deposit_amount numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Profesionales (Staff)
CREATE TABLE public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  bio text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. Horarios de Profesionales
CREATE TABLE public.professional_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo
  start_time time NOT NULL,
  end_time time NOT NULL,
  UNIQUE(professional_id, day_of_week)
);

-- 7. Turnos (Appointments)
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.profiles(id),
  professional_id uuid REFERENCES public.professionals(id),
  service_id uuid REFERENCES public.services(id),
  appointment_datetime timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'confirmed', 'cancelled')),
  payment_method text CHECK (payment_method IN ('mercadopago', 'cash')),
  created_at timestamp with time zone DEFAULT now()
);

-- 8. Pagos de Mercado Pago
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  mp_preference_id text,
  mp_payment_id text,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas Básicas (RLS)
-- Los negocios son públicos para lectura
CREATE POLICY "Public profiles are viewable by everyone" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Servicios viewable by everyone" ON public.services FOR SELECT USING (true);
CREATE POLICY "Professionals viewable by everyone" ON public.professionals FOR SELECT USING (true);
CREATE POLICY "Hours viewable by everyone" ON public.professional_hours FOR SELECT USING (true);

-- (Las políticas de Admin y Clientes se ajustarán más adelante en detalle)
