import { createFileRoute } from "@tanstack/react-router";

/**
 * Webhook de Mercado Pago.
 * MP avisa por POST con ?type=payment&data.id=<id>. Consultamos el pago,
 * y si está "approved" confirmamos el turno asociado (external_reference).
 *
 * Va bajo /api/webhooks (no /api/public) porque MP no firma con HMAC propio;
 * validamos consultando el pago real contra la API con nuestro access token.
 */
export const Route = createFileRoute("/api/webhooks/mercadopago")({
  server: {
    handlers: {
      // MP a veces hace un GET de verificación
      GET: async () => new Response("ok"),
      POST: async ({ request }) => {
        const url = new URL(request.url);
        let paymentId =
          url.searchParams.get("data.id") || url.searchParams.get("id");

        if (!paymentId) {
          try {
            const body = (await request.json()) as { data?: { id?: string } };
            paymentId = body?.data?.id ?? null;
          } catch {
            /* sin body */
          }
        }
        if (!paymentId) return new Response("missing payment id", { status: 200 });

        const accessToken = process.env.MP_ACCESS_TOKEN!;
        const res = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!res.ok) return new Response("payment lookup failed", { status: 200 });

        const payment = (await res.json()) as {
          status: string;
          external_reference: string | null;
        };

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const newStatus =
          payment.status === "approved"
            ? "approved"
            : payment.status === "rejected"
              ? "rejected"
              : "pending";

        await supabaseAdmin
          .from("payments")
          .update({ status: newStatus, mp_payment_id: String(paymentId) })
          .eq("mp_preference_id", payment.external_reference ?? "");

        if (payment.status === "approved" && payment.external_reference) {
          await supabaseAdmin
            .from("appointments")
            .update({ status: "confirmed" })
            .eq("id", payment.external_reference);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
