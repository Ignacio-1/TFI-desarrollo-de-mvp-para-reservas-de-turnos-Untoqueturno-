import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const readReplicaUrl = process.env.SUPABASE_READ_REPLICA_URL || supabaseUrl;

const sharedConfig = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    fetch: (...args: any[]) => fetch(args[0], args[1]),
  }
};

export const writeDbClient = createClient(supabaseUrl, supabaseKey, sharedConfig);
export const readDbClient = createClient(readReplicaUrl, supabaseKey, sharedConfig);
