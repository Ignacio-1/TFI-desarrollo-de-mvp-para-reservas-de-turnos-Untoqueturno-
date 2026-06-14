import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

serve(async (req) => {
  try {
    const payload = await req.json()
    console.log("Webhook payload:", payload)

    // Procesar eventos de Mercado Pago (pago o suscripción)
    if (payload.type === 'payment' || payload.type === 'subscription_preapproval') {
      const id = payload.data.id

      // Obtener Token de MP de las variables de entorno de Supabase
      const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")
      if (!MP_ACCESS_TOKEN) throw new Error("Falta configurar MP_ACCESS_TOKEN")

      // Consultar la API de MP para obtener el estado real y la referencia
      let endpoint = `https://api.mercadopago.com/v1/payments/${id}`;
      if (payload.type === 'subscription_preapproval') {
         endpoint = `https://api.mercadopago.com/preapproval/${id}`;
      }

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
      })
      const mpData = await res.json()

      console.log("MP Data consultada:", mpData)

      // La referencia externa (external_reference) guardará el ID del negocio
      const businessId = mpData.external_reference
      const status = mpData.status

      if (businessId && (status === 'approved' || status === 'authorized')) {
        // Usar la SERVICE ROLE KEY para poder modificar la BD sin restricciones
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        const supabase = createClient(supabaseUrl, supabaseKey)

        const updateData: any = { subscription_status: 'active' }
        if (payload.type === 'subscription_preapproval') {
          updateData.mp_subscription_id = id
        }

        const { error } = await supabase
          .from("businesses")
          .update(updateData)
          .eq("id", businessId)

        if (error) throw error
        console.log(`¡Éxito! Negocio ${businessId} activado mediante webhook.`)
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    })
  } catch (error: any) {
    console.error("Error procesando webhook:", error)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { "Content-Type": "application/json" },
      status: 400 
    })
  }
})
