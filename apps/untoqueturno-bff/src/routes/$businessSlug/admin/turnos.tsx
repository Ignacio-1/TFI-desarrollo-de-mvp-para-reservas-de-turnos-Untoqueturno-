import { createFileRoute, useParams } from "@tanstack/react-router";
import { AdminHeader } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useBusiness, useAppointments, useServices } from "@/lib/queries";
import { formatDateShort } from "@/lib/format";
import { CalendarDays, Phone, Briefcase, Banknote, CreditCard, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$businessSlug/admin/turnos")({
  component: AdminTurnos,
});

function AdminTurnos() {
  const { businessSlug } = useParams({ from: "/$businessSlug/admin/turnos" });
  const qc = useQueryClient();
  const { data: business } = useBusiness(businessSlug);
  const { data: appointments = [] } = useAppointments(business?.id);
  const { data: services = [] } = useServices(business?.id);

  const activeAppointments = appointments
    .filter((a) => a.status === "confirmed" || a.status === "pending_payment")
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const togglePaid = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("appointments")
      .update({ is_paid: !current })
      .eq("id", id);
    if (error) {
      toast.error("Error al actualizar pago: " + error.message);
    } else {
      toast.success(current ? "Marcado como no pagado" : "Marcado como pagado");
      qc.invalidateQueries({ queryKey: ["appointments", business?.id] });
    }
  };

  return (
    <>
      <AdminHeader
        title="Turnos"
        description="Listado detallado de todas tus reservas."
      />

      {activeAppointments.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No hay turnos registrados todavía.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeAppointments.map((app: any) => {
            const service = services.find((s) => s.id === app.service_id);
            const isPending = app.status === "pending_payment";
            const payments = app.payments || [];
            
            // Payment logic
            let paymentMsg = "";
            let paymentIcon = <Banknote className="h-4 w-4" />;
            let isTotalMp = false;
            let missingAmount = 0;

            if (payments.length > 0) {
              const mpPayment = payments.find((p: any) => p.method === "mercadopago" && p.status === "approved");
              const cashPayment = payments.find((p: any) => p.method === "cash");
              
              if (mpPayment && service) {
                if (mpPayment.amount >= service.price) {
                  isTotalMp = true;
                  paymentMsg = "Total pagado (Mercado Pago)";
                  paymentIcon = <CreditCard className="h-4 w-4 text-primary" />;
                } else {
                  missingAmount = service.price - mpPayment.amount;
                  paymentMsg = `Seña pagada (MP). Faltan ${formatMoney(missingAmount)}`;
                  paymentIcon = <CreditCard className="h-4 w-4 text-primary" />;
                }
              } else if (cashPayment && service) {
                missingAmount = service.price;
                paymentMsg = `Abonará en local. Faltan ${formatMoney(missingAmount)}`;
              }
            } else if (service) {
                missingAmount = service.price;
                paymentMsg = `Faltan ${formatMoney(missingAmount)}`;
            }
            
            const isFullyPaid = isTotalMp || app.is_paid;
            
            return (
              <Card key={app.id} className={cn("overflow-hidden transition-colors hover:bg-muted/30", !isFullyPaid && "border-yellow-500/50")}>
                <div className={cn("h-1 w-full", isFullyPaid ? "bg-primary" : "bg-yellow-500")} />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-lg">{app.client_name}</span>
                      <span className="text-xs text-muted-foreground uppercase">{app.client_gender}</span>
                    </div>
                    {isFullyPaid ? (
                      <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        <CheckCircle2 className="h-3 w-3" /> COBRADO
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-600">
                        PAGO PENDIENTE
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>{formatDateShort(app.date)} a las {app.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span className="font-medium text-foreground">{service?.name || "Servicio eliminado"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{app.client_phone || "Sin teléfono"}</span>
                    </div>
                    <div className="flex items-start gap-2 pt-2 border-t mt-3">
                      <div className="mt-0.5">{paymentIcon}</div>
                      <div className="flex-1 flex flex-col items-start gap-2">
                        <span className={cn(isTotalMp ? "text-primary font-medium" : "")}>{paymentMsg}</span>
                        {!isTotalMp && (
                          <Button 
                            variant={app.is_paid ? "outline" : "default"} 
                            size="sm" 
                            className="h-7 px-3 text-xs w-full mt-1"
                            onClick={() => togglePaid(app.id, app.is_paid)}
                          >
                            {app.is_paid ? "Marcar como no pagado" : "Marcar como cobrado"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
