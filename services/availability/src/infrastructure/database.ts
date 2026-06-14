import { createClient } from "@supabase/supabase-js";

// Cliente de acceso a datos 100% independiente para el microservicio.
// Configurado sin persistencia de sesión para soportar concurrencia masiva (stateless).
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const dbClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    // Se utiliza el fetch nativo para optimizar el pool de conexiones en la capa de red
    fetch: (...args) => fetch(...args),
  }
});
