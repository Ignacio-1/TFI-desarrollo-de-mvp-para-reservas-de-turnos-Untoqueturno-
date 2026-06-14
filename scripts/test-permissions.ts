import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const url = process.env.VITE_SUPABASE_URL!;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;

// Cliente público estándar (como si fuera un usuario en el navegador)
const supabase = createClient(url, anonKey);

async function runPermissionTests() {
  console.log('--- Iniciando Test de Seguridad (Hackers) ---');

  // Supongamos que conocemos un ID de un turno real (creado por otro cliente)
  // Reemplaza esto mentalmente por cualquier ID de tu base de datos
  const targetAppointmentId = "89d70a18-d642-4b73-8dba-ed38c3a1b351"; // Del test E2E anterior
  
  console.log('\nEscenario: Hacker intenta leer el turno de otra persona para robar su celular/email...');
  
  const { data, error } = await supabase
    .from('appointments')
    .select('client_name, client_email, client_phone')
    .eq('id', targetAppointmentId);
    
  if (error) {
    console.error('Error en la consulta:', error.message);
  } else if (data && data.length > 0) {
    console.error('❌ PELIGRO: El hacker logró leer los datos de otra persona:', data);
  } else {
    console.log('✅ ÉXITO: La base de datos bloqueó al hacker silenciosamente (retornó vacío).');
  }
}

runPermissionTests();
