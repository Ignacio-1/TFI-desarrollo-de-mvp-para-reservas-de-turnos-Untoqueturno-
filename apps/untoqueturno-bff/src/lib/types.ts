// Tipos del dominio (espejo de las tablas de Supabase).

export type SubscriptionStatus = "trial" | "active" | "inactive";
export type BusinessRole = "owner" | "admin" | "client";
export type AppointmentStatus = "pending_payment" | "confirmed" | "cancelled";
export type PaymentMethod = "cash" | "mercadopago";

export interface Business {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  primary_color: string;
  logo_emoji: string;
  whatsapp_number: string | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  mp_subscription_id: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration_min: number;
  capacity: number;
  price: number;
  deposit: number;
  active: boolean;
  target_gender: "hombres" | "mujeres" | "ambos";
}

export interface ProfessionalHour {
  id: string;
  professional_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // "HH:mm"
  end_time: string;
}

export interface Professional {
  id: string;
  business_id: string;
  name: string;
  title: string | null;
  avatar_color: string;
  service_ids: string[];
  active: boolean;
  hours?: ProfessionalHour[];
}

export interface Appointment {
  id: string;
  business_id: string;
  service_id: string;
  professional_id: string;
  client_id: string | null;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_gender?: "hombre" | "mujer";
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  is_paid: boolean;
  created_at: string;
}

export const statusLabels: Record<AppointmentStatus, string> = {
  pending_payment: "Pendiente de pago",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
};

export const WEEKDAYS: { weekday: number; label: string }[] = [
  { weekday: 1, label: "Lunes" },
  { weekday: 2, label: "Martes" },
  { weekday: 3, label: "Miércoles" },
  { weekday: 4, label: "Jueves" },
  { weekday: 5, label: "Viernes" },
  { weekday: 6, label: "Sábado" },
  { weekday: 0, label: "Domingo" },
];
