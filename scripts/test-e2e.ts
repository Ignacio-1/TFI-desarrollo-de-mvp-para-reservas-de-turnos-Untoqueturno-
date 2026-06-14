import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Cargar .env
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // usamos service role para bypass RLS y probar logica pura
const mpToken = process.env.MP_ACCESS_TOKEN!;

if (!supabaseUrl || !supabaseKey || !mpToken) {
  console.error('Faltan variables de entorno para correr los tests E2E');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('--- Iniciando Test E2E de Lógica de Negocio ---');
  
  try {
    // 1. Crear un negocio de prueba
    console.log('1. Creando negocio de prueba...');
    const { data: business, error: bErr } = await supabase
      .from('businesses')
      .insert({
        slug: 'test-business-' + Date.now(),
        name: 'Test Business',
      })
      .select()
      .single();

    if (bErr) throw new Error('Error al crear negocio: ' + bErr.message);
    console.log('   Negocio creado:', business.id);

    // 2. Crear un profesional
    console.log('2. Creando profesional de prueba...');
    const { data: pro, error: pErr } = await supabase
      .from('professionals')
      .insert({
        business_id: business.id,
        name: 'Carlos Tester',
      })
      .select()
      .single();
    if (pErr) throw new Error('Error profesional: ' + pErr.message);

    // Horarios del profesional (Lunes, 09 a 18)
    await supabase.from('professional_hours').insert({
      professional_id: pro.id,
      weekday: 1, // Lunes
      start_time: '09:00:00',
      end_time: '18:00:00'
    });
    console.log('   Profesional creado:', pro.id);

    // 3. Crear servicio
    console.log('3. Creando servicio de prueba...');
    const { data: service, error: sErr } = await supabase
      .from('services')
      .insert({
        business_id: business.id,
        name: 'Corte E2E',
        duration_min: 45,
        price: 5000,
        deposit: 1000
      })
      .select()
      .single();
    if (sErr) throw new Error('Error servicio: ' + sErr.message);
    console.log('   Servicio creado:', service.id);

    // 4. Crear turno (Appointment)
    console.log('4. Agendando turno...');
    const { data: appt, error: aErr } = await supabase
      .from('appointments')
      .insert({
        business_id: business.id,
        service_id: service.id,
        professional_id: pro.id,
        date: '2024-10-14', // Es un Lunes hipotético
        time: '14:00:00',
        status: 'pending_payment',
        client_name: 'Test Client'
      })
      .select()
      .single();
    if (aErr) throw new Error('Error turno: ' + aErr.message);
    console.log('   Turno creado:', appt.id);

    // 5. Probar preferencia de Mercado Pago
    console.log('5. Generando preferencia de Mercado Pago...');
    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: service.name,
            quantity: 1,
            unit_price: service.deposit,
            currency_id: "ARS",
          },
        ],
        external_reference: appt.id,
        back_urls: {
          success: `https://localhost:5173/test/mis-turnos?pago=ok`,
          failure: `https://localhost:5173/test/checkout?pago=error`,
          pending: `https://localhost:5173/test/mis-turnos?pago=pendiente`,
        },
        auto_return: "approved",
      }),
    });

    if (!res.ok) {
      const errDetail = await res.text();
      throw new Error('Error Mercado Pago: ' + errDetail);
    }

    const pref = await res.json();
    console.log('   Preferencia MP generada OK! Init Point:', pref.init_point);

    // 6. Limpieza
    console.log('6. Limpiando datos de prueba...');
    await supabase.from('businesses').delete().eq('id', business.id); // Cascade borrará todo lo demás
    console.log('   Limpieza completada.');

    console.log('✅ TEST E2E COMPLETADO CON ÉXITO');

  } catch (error) {
    console.error('❌ Falló el Test E2E:', error);
  }
}

runTests();
