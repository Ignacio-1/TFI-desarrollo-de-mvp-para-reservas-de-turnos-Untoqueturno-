import { createClient } from "@supabase/supabase-js";

// Cliente de navegador. Usa la anon key + sesión persistida del usuario.
// RLS aplica como el usuario logueado.
const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
