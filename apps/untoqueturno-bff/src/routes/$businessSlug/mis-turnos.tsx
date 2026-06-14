import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, CalendarX2, Clock, User } from "lucide-react";
import { ClientLayout } from "@/components/ClientLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useBusiness,
  useMyAppointments,
  useServices,
  useProfessionals,
} from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatDateLong } from "@/lib/format";
import { todayISO } from "@/lib/format";
import type { Appointment } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/$businessSlug/mis-turnos")({
  head: () => ({ meta: [{ title: "Mis turnos" }] }),
  component: MisTurnos,
});

function MisTurnos() {
  const { businessSlug } = useParams({ from: "/$businessSlug/mis-turnos" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [client, setClient] = useState<{ name: string; phone: string; gender: string } | null>(() => {
    try {
      const saved = localStorage.getItem(`turnoapp_client_${businessSlug}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const { data: business } = useBusiness(businessSlug);
  const { data: services = [] } = useServices(business?.id);
  const { data: professionals = [] } = useProfessionals(business?.id);
  const { data: appointments = [] } = useMyAppointments(business?.id, client?.phone);

  if (!business) return <div className="grid min-h-screen place-items-center">Cargando…</div>;

  if (!client) {
    return (
      <ClientLayout business={business}>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">Identificate</h1>
          <p className="mt-2 text-muted-foreground">Ingresá tus datos para ver tus turnos.</p>
          <Button className="mt-6" onClick={() => navigate({ to: "/$businessSlug", params: { businessSlug } })}>
            Volver al inicio
          </Button>
        </div>
      </ClientLayout>
    );
  }

  const mine = [...appointments].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const today = todayISO();
  const nowMs = Date.now();

  const isExpired = (a: Appointment) =>
    a.status === "pending_payment" && nowMs - new Date(a.created_at).getTime() > 180000;

  const upcoming = mine.filter((a) => a.date >= today && a.status !== "cancelled" && !isExpired(a));
  const history = mine.filter((a) => a.date < today || a.status === "cancelled" || isExpired(a));

  const cancel = async (id: string) => {
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Turno cancelado");
    qc.invalidateQueries({ queryKey: ["my-appointments"] });
  };

  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? "";
  const proName = (id: string) => professionals.find((p) => p.id === id)?.name ?? "";

  return (
    <ClientLayout business={business}>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mis turnos</h1>
            <p className="mt-1 text-muted-foreground">Gestioná tus reservas.</p>
          </div>
          <Button onClick={() => navigate({ to: "/$businessSlug", params: { businessSlug } })}>
            <CalendarPlus className="mr-1 h-4 w-4" /> Nuevo turno
          </Button>
        </div>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Próximos</h2>
          {upcoming.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                  <CalendarX2 className="h-6 w-6" />
                </span>
                <p className="text-sm text-muted-foreground">No tenés turnos próximos.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcoming.map((a) => (
                <Row
                  key={a.id}
                  appointment={a}
                  serviceName={serviceName(a.service_id)}
                  proName={proName(a.professional_id)}
                  businessPhone={business.whatsapp_number}
                  onCancel={() => cancel(a.id)}
                  onPay={() => navigate({ to: "/$businessSlug/checkout", search: { appointment: a.id }, params: { businessSlug } })}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Historial</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin turnos anteriores.</p>
          ) : (
            <div className="space-y-3">
              {history.map((a) => (
                <Row
                  key={a.id}
                  appointment={a}
                  serviceName={serviceName(a.service_id)}
                  proName={proName(a.professional_id)}
                  businessPhone={business.whatsapp_number}
                  isExpired={isExpired(a)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </ClientLayout>
  );
}

function Row({
  appointment,
  serviceName,
  proName,
  businessPhone,
  onCancel,
  onPay,
  isExpired,
}: {
  appointment: Appointment;
  serviceName: string;
  proName: string;
  businessPhone?: string | null;
  onCancel?: () => void;
  onPay?: () => void;
  isExpired?: boolean;
}) {
  const dateLabel = formatDateLong(appointment.date);
  const statusToDisplay = isExpired ? "cancelled" : appointment.status;

  const handleWhatsApp = () => {
    if (!businessPhone) return;
    const cleanPhone = businessPhone.replace(/\D/g, "");
    const msg = `¡Hola! Acabo de reservar un turno para ${serviceName} el ${dateLabel} a las ${appointment.time.slice(0, 5)}. Mi nombre es ${appointment.client_name}.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <Card className={isExpired ? "opacity-60" : ""}>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{serviceName}</h3>
            {isExpired ? (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-destructive/10 text-destructive">
                Expirado
              </span>
            ) : (
              <StatusBadge status={statusToDisplay} />
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 capitalize">
              <Clock className="h-4 w-4" /> {dateLabel} · {appointment.time.slice(0, 5)}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" /> {proName}
            </span>
          </div>
        </div>
        {(!isExpired && (onCancel || onPay)) && (
          <div className="flex items-center gap-2">
            {onPay && appointment.status === "pending_payment" && (
              <Button size="sm" onClick={onPay}>
                Pagar
              </Button>
            )}
            {onCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline">Cancelar</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar este turno?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {serviceName} · {dateLabel} a las {appointment.time.slice(0, 5)}. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Volver</AlertDialogCancel>
                    <AlertDialogAction onClick={onCancel}>Sí, cancelar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {(!isExpired && businessPhone && appointment.status !== "cancelled") && (
              <Button size="sm" variant="secondary" onClick={handleWhatsApp} className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                Avisar por WhatsApp
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
