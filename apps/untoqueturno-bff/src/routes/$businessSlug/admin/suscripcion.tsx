import { createFileRoute, useParams } from "@tanstack/react-router";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { AdminHeader } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/lib/queries";
import { getSubscriptionState } from "@/lib/subscription";
import { useAuth } from "@/contexts/AuthProvider";
import { useServerFn } from "@tanstack/react-start";
import { createSubscriptionLink } from "@/lib/payments.functions";
import { useState } from "react";

export const Route = createFileRoute("/$businessSlug/admin/suscripcion")({
  head: () => ({ meta: [{ title: "Suscripción" }] }),
  component: BillingPage,
});

function BillingPage() {
  const { businessSlug } = useParams({ from: "/$businessSlug/admin/suscripcion" });
  const { data: business, isLoading } = useBusiness(businessSlug);
  const { user } = useAuth();
  const generateLink = useServerFn(createSubscriptionLink);
  const [isGenerating, setIsGenerating] = useState(false);

  if (isLoading || !business) {
    return <div className="grid min-h-[50vh] place-items-center">Cargando...</div>;
  }

  const { status, daysLeft } = getSubscriptionState(business);

  const handleSubscribe = async () => {
    try {
      setIsGenerating(true);
      const email = user?.email || "cliente@turnoapp.com";
      const result = await generateLink({ 
        data: {
          businessId: business.id, 
          payerEmail: email,
          slug: business.slug
        }
      });
      
      if (result.init_point) {
        window.location.href = result.init_point;
      }
    } catch (error) {
      console.error("Error al generar el pago", error);
      alert("Hubo un problema contactando a Mercado Pago. Intenta nuevamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <AdminHeader
        title="Facturación y Suscripción"
        description="Gestiona el pago mensual de tu plataforma."
      />
      
      <div className="mx-auto max-w-3xl mt-8">
        <Card className="border-primary shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              Estado de tu cuenta
            </CardTitle>
            <CardDescription>
              {status === "active" && "Tu suscripción está activa. ¡Gracias por usar Un Toque Turnos!"}
              {status === "trialing" && `Estás en tu periodo de prueba. Te quedan ${daysLeft} días.`}
              {status === "expired" && "Tu periodo de prueba ha finalizado. Suscríbete para continuar usando la plataforma."}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="rounded-lg border bg-muted/30 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="font-semibold text-lg">Plan Profesional</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Turnos ilimitados</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Integración con Mercado Pago</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Avisos por WhatsApp</li>
                </ul>
              </div>
              
              <div className="text-center md:text-right">
                <div className="text-3xl font-bold">$20.000<span className="text-base font-normal text-muted-foreground">/mes</span></div>
                <div className="mt-1 text-sm text-muted-foreground">Facturación recurrente</div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 border-t bg-muted/10 p-6">
            {status === "active" ? (
              <Button variant="outline">Gestionar método de pago</Button>
            ) : (
              <Button size="lg" onClick={handleSubscribe} disabled={isGenerating}>
                {isGenerating ? "Cargando Mercado Pago..." : status === "trialing" ? "Suscribirse ahora" : "Activar Suscripción"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
