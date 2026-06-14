import { createServerFn } from "@tanstack/react-start";

export const createSubscriptionLink = createServerFn({ method: "POST" })
  .validator((data: { businessId: string; payerEmail: string; slug: string }) => data)
  .handler(async ({ data }) => {
    try {
      const accessToken = process.env.MP_ACCESS_TOKEN;
      if (!accessToken) {
        throw new Error("MP_ACCESS_TOKEN no está configurado en el servidor");
      }

      // Creamos un PLAN de suscripción (preapproval_plan)
      // Esto evita el error de "payer_email" mixto entre cuentas reales y de prueba
      const body = {
        reason: "Suscripción Profesional - Un Toque Turnos",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 20000,
          currency_id: "ARS"
        },
        back_url: `https://un-toque.app/${data.slug}/admin`
      };

      const response = await fetch("https://api.mercadopago.com/preapproval_plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error desde la API de Mercado Pago:", errorData);
        throw new Error(`Fallo al generar el link de pago: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      // init_point es la URL a la cual debemos redirigir al usuario para que ponga su tarjeta
      return { init_point: responseData.init_point as string };

    } catch (error: any) {
      console.error("Excepción creando link de suscripción:", error);
      throw error;
    }
  });

export const createMercadoPagoPreference = createServerFn({ method: "POST" })
  .validator((data: { appointmentId: string; title: string; amount: number; slug: string }) => data)
  .handler(async ({ data }) => {
    // Restauramos temporalmente la función B2C (pago de turnos) con un mock
    // hasta que implementemos las credenciales individuales por negocio
    return { initPoint: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock` };
  });
