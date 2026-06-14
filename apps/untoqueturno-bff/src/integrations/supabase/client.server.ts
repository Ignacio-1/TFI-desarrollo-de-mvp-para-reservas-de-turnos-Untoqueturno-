import { createClient } from "@supabase/supabase-js";

// Cliente de servidor (service role). BYPASS de RLS.
// Importar SOLO dentro de handlers de server functions / server routes,
// nunca en el bundle del cliente. El nombre *.server.ts bloquea el import.
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
