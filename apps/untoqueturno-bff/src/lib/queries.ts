import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Appointment,
  Business,
  Professional,
  Service,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Lecturas (RLS aplica: lectura pública en negocio/servicios/profesionales)
// ---------------------------------------------------------------------------

export function useBusiness(slug: string) {
  return useQuery({
    queryKey: ["business", slug],
    queryFn: async (): Promise<Business | null> => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useServices(businessId: string | undefined) {
  return useQuery({
    queryKey: ["services", businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<Service[]> => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", businessId)
        .eq("active", true)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProfessionals(businessId: string | undefined) {
  return useQuery({
    queryKey: ["professionals", businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<Professional[]> => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*, hours:professional_hours(*)")
        .eq("business_id", businessId)
        .eq("active", true)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as Professional[];
    },
  });
}

export function useAppointments(businessId: string | undefined) {
  return useQuery({
    queryKey: ["appointments", businessId],
    enabled: !!businessId,
    queryFn: async (): Promise<(Appointment & { payments: any[] })[]> => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, payments(*)")
        .eq("business_id", businessId)
        .order("date");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyAppointments(businessId: string | undefined, clientPhone: string | undefined) {
  return useQuery({
    queryKey: ["my-appointments", businessId, clientPhone],
    enabled: !!businessId && !!clientPhone,
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("business_id", businessId)
        .eq("client_phone", clientPhone)
        .order("date");
      if (error) throw error;
      return data ?? [];
    },
  });
}
