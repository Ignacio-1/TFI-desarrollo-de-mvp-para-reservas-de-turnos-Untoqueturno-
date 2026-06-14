import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banknote, CreditCard, ShieldCheck } from "lucide-react";
import { ClientLayout } from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBusiness } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { createMercadoPagoPreference } from "@/lib/payments.functions";
import { formatMoney, formatDateLong } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/$businessSlug/checkout")({
  validateSearch: (s: Record<string, unknown>) => ({
    appointment: typeof s.appointment === "string" ? s.appointment : "",
  }),
  head: () => ({ meta: [{ title: "Pago" }] }),
  component: Checkout,
});

function Checkout() {
  const { businessSlug } = useParams({ from: "/$businessSlug/checkout" });
  const { appointment: appointmentId } = Route.useSearch();
  const navigate = useNavigate();
  const { data: business } = useBusiness(businessSlug);
  const [loading, setLoading] = useState(false);

  const { data: detail } = useQuery({
    queryKey: ["appointment-detail", appointmentId],
    enabled: !!appointmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, service:services(*), professional:professionals(*)")
        .eq("id", appointmentId)
        .maybeSingle();
      if (error) throw error;
      return data as
        | (typeof data & {
            service: { name: string; price: number; deposit: number; duration_min: number };
            professional: { name: string };
          })
        | null;
    },
  });

  if (!business) return <div className="grid min-h-screen place-items-center">Cargando…</div>;
  if (!detail) {
    return (
      <ClientLayout business={business}>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">No hay ninguna reserva pendiente</h1>
          <Button className="mt-6" onClick={() => navigate({ to: "/$businessSlug", params: { businessSlug } })}>
            Reservar turno
          </Button>
        </div>
      </ClientLayout>
    );
  }

  const deposit = detail.service.deposit;
  const price = detail.service.price;
  const hasDeposit = deposit > 0;

  const payCash = async () => {
    // Pago en efectivo: el turno queda reservado, se cobra en el local.
    await supabase.from("payments").insert({
      appointment_id: detail.id,
      method: "cash",
      status: "pending",
      amount: price,
    });
    toast.success("Turno reservado. Pagás en el local.");
    navigate({ to: "/$businessSlug/mis-turnos", params: { businessSlug } });
  };

  const payMercadoPago = async (amountToPay: number, type: "seña" | "total") => {
    setLoading(true);
    try {
      const { initPoint } = await createMercadoPagoPreference({
        data: {
          appointmentId: detail.id,
          title: `${type === "seña" ? "Seña" : "Pago Total"} · ${detail.service.name}`,
          amount: amountToPay,
          slug: businessSlug,
        },
      });
      window.location.href = initPoint; // redirige a Checkout Pro
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo iniciar el pago";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <ClientLayout business={business}>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Pago de reserva</h1>
        <p className="mt-1 text-muted-foreground">Elegí cómo querés abonar tu turno.</p>

        <Card className="mt-8">
          <CardContent className="space-y-3 p-6">
            <h3 className="font-semibold">Resumen</h3>
            <div className="text-sm text-muted-foreground">
              {detail.service.name} · {detail.professional.name}
            </div>
            <div className="text-sm capitalize text-muted-foreground">
              {formatDateLong(detail.date)} · {detail.time.slice(0, 5)}
            </div>
            <div className="flex items-center justify-between border-t pt-3 text-lg font-semibold">
              <span>Precio total</span>
              <span>{formatMoney(price)}</span>
            </div>
            {hasDeposit && (
              <div className="flex items-center justify-between text-sm font-semibold mt-1">
                <span className="text-muted-foreground">Seña requerida</span>
                <span className="text-primary">{formatMoney(deposit)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {hasDeposit ? (
            <>
              <Card className="transition-shadow hover:shadow-md border-primary/50">
                <CardContent className="flex flex-col items-start gap-3 p-6 h-full">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <CreditCard className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold">Pagar seña y resto en local</h3>
                  <p className="text-sm text-muted-foreground flex-1">Pagá {formatMoney(deposit)} ahora para asegurar tu lugar.</p>
                  <Button className="mt-2 w-full" onClick={() => payMercadoPago(deposit, "seña")} disabled={loading}>
                    {loading ? "Redirigiendo…" : "Pagar seña"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-start gap-3 p-6 h-full">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <CreditCard className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold">Pagar la totalidad</h3>
                  <p className="text-sm text-muted-foreground flex-1">Pagá {formatMoney(price)} con Mercado Pago y olvidate.</p>
                  <Button variant="outline" className="mt-2 w-full border-primary text-primary hover:bg-primary/5" onClick={() => payMercadoPago(price, "total")} disabled={loading}>
                    {loading ? "Redirigiendo…" : "Pagar total"}
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="transition-shadow hover:shadow-md border-primary/50">
                <CardContent className="flex flex-col items-start gap-3 p-6 h-full">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <CreditCard className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold">Pagar la totalidad</h3>
                  <p className="text-sm text-muted-foreground flex-1">Pagá {formatMoney(price)} de forma segura con Mercado Pago.</p>
                  <Button className="mt-2 w-full" onClick={() => payMercadoPago(price, "total")} disabled={loading}>
                    {loading ? "Redirigiendo…" : "Pagar con Mercado Pago"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-start gap-3 p-6 h-full">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <Banknote className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold">Efectivo en el local</h3>
                  <p className="text-sm text-muted-foreground flex-1">Reservá ahora sin poner tarjeta y pagá al llegar.</p>
                  <Button variant="outline" className="mt-2 w-full" onClick={payCash} disabled={loading}>
                    Reservar y pagar en el local
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {hasDeposit && (
          <p className="mt-6 flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> La seña se descuenta automáticamente del total del servicio.
          </p>
        )}
      </div>
    </ClientLayout>
  );
}
