import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Briefcase,
  User,
  CalendarDays,
  MapPin,
  Info,
} from "lucide-react";
import { ClientLayout } from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatMoney, formatDateLong, todayISO } from "@/lib/format";
import { buildAvailableSlots } from "@/lib/availability";
import {
  useBusiness,
  useServices,
  useProfessionals,
  useAppointments,
} from "@/lib/queries";
import { isSubscriptionActive } from "@/lib/subscription";
import { SubscriptionBlocker } from "@/components/SubscriptionBlocker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClientData = {
  name: string;
  phone: string;
  gender: "hombre" | "mujer";
};

export const Route = createFileRoute("/$businessSlug/")({
  head: () => ({ meta: [{ title: "Reservar turno" }] }),
  component: BookingPage,
});

const steps = [
  { n: 1, label: "Servicio", icon: Briefcase },
  { n: 2, label: "Profesional", icon: User },
  { n: 3, label: "Horario", icon: CalendarDays },
  { n: 4, label: "Confirmar", icon: Check },
];

function BookingPage() {
  const { businessSlug } = useParams({ from: "/$businessSlug/" });
  const navigate = useNavigate();

  const { data: business, isLoading } = useBusiness(businessSlug);
  const { data: services = [] } = useServices(business?.id);
  const { data: professionals = [] } = useProfessionals(business?.id);
  const { data: appointments = [] } = useAppointments(business?.id);

  const [client, setClient] = useState<ClientData | null>(() => {
    try {
      const saved = localStorage.getItem(`turnoapp_client_${businessSlug}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [draftClient, setDraftClient] = useState<Partial<ClientData>>({});
  
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [proId, setProId] = useState<string | null>(null);
  const [dateISO, setDateISO] = useState<string>(() => todayISO());
  const [time, setTime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredServices = useMemo(() => {
    if (!client) return [];
    const clientGenderGroup = client.gender === "hombre" ? "hombres" : "mujeres";
    return services.filter(s => s.target_gender === "ambos" || s.target_gender === clientGenderGroup);
  }, [services, client]);

  const service = filteredServices.find((s) => s.id === serviceId);
  const pro = professionals.find((p) => p.id === proId);

  const availablePros = useMemo(
    () => professionals.filter((p) => !serviceId || p.service_ids.includes(serviceId)),
    [professionals, serviceId],
  );

  const availableDays = useMemo(() => {
    if (!pro || !pro.hours?.length) return [];
    
    const today = todayISO();
    const uniqueDates = Array.from(new Set(pro.hours.map(h => h.date)));
    return uniqueDates.filter(d => d >= today).sort();
  }, [pro]);

  useEffect(() => {
    if (availableDays.length > 0 && !availableDays.includes(dateISO)) {
      setDateISO(availableDays[0]);
    }
  }, [availableDays, dateISO]);

  const slots = useMemo(() => {
    if (!pro || !service || !availableDays.includes(dateISO)) return [];
    return buildAvailableSlots(pro, dateISO, service, appointments);
  }, [pro, service, dateISO, appointments, availableDays]);

  const canNext =
    (step === 1 && serviceId) ||
    (step === 2 && proId) ||
    (step === 3 && time) ||
    step === 4;

  const handleClientLogin = () => {
    if (!draftClient.name?.trim() || !draftClient.phone?.trim() || !draftClient.gender) {
      return toast.error("Por favor completa todos tus datos.");
    }
    const data = draftClient as ClientData;
    localStorage.setItem(`turnoapp_client_${businessSlug}`, JSON.stringify(data));
    setClient(data);
  };

  const confirm = async () => {
    if (!business || !service || !pro || !time || !client) return;
    
    setSaving(true);
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        business_id: business.id,
        service_id: service.id,
        professional_id: pro.id,
        client_id: (await supabase.auth.getUser()).data.user?.id || null,
        client_name: client.name,
        client_phone: client.phone,
        client_gender: client.gender,
        date: dateISO,
        time,
        status: "pending_payment",
      })
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    navigate({
      to: "/$businessSlug/checkout",
      params: { businessSlug },
      search: { appointment: data.id },
    });
  };

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Cargando…</div>;
  }
  if (!business) {
    return <div className="grid min-h-screen place-items-center">Negocio no encontrado.</div>;
  }

  if (!isSubscriptionActive(business)) {
    return <SubscriptionBlocker businessSlug={businessSlug} isAdmin={false} />;
  }

  if (!client) {
    return (
      <ClientLayout business={business}>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <span className={cn("mx-auto grid h-16 w-16 place-items-center rounded-2xl mb-6", business.logo_emoji ? "bg-primary/10 text-3xl" : "bg-primary text-primary-foreground font-bold text-2xl")}>
            {business.logo_emoji || business.name.charAt(0).toUpperCase()}
          </span>
          <h1 className="text-3xl font-bold tracking-tight">¡Bienvenido!</h1>
          <p className="mt-2 text-muted-foreground mb-8">Ingresá tus datos para ver nuestros servicios y reservar.</p>
          
          <Card className="text-left border-primary/20 shadow-lg">
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1.5">
                <Label>Tu nombre</Label>
                <Input value={draftClient.name || ""} onChange={(e) => setDraftClient({ ...draftClient, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Tu teléfono</Label>
                <Input type="tel" value={draftClient.phone || ""} onChange={(e) => setDraftClient({ ...draftClient, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Seleccioná tu sexo</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={draftClient.gender === "mujer" ? "default" : "outline"} 
                    onClick={() => setDraftClient({ ...draftClient, gender: "mujer" })}
                    className="flex-1"
                  >
                    Mujer
                  </Button>
                  <Button 
                    variant={draftClient.gender === "hombre" ? "default" : "outline"} 
                    onClick={() => setDraftClient({ ...draftClient, gender: "hombre" })}
                    className="flex-1"
                  >
                    Hombre
                  </Button>
                </div>
              </div>
              
              <Button className="w-full mt-2 h-11 text-base shadow-md" onClick={handleClientLogin}>
                Ver servicios <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout business={business}>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Reservar turno</h1>
        <p className="mt-1 text-muted-foreground">Seguí los pasos para confirmar tu reserva.</p>

        {(business.description || business.address) && (
          <Card className="mt-6 bg-card/50 border-primary/10 shadow-sm">
            <CardContent className="p-4 space-y-3 text-sm">
              {business.description && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  <p className="leading-relaxed">{business.description}</p>
                </div>
              )}
              {business.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <p>{business.address}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-8 flex items-center">
          {steps.map((s, i) => (
            <div key={s.n} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-semibold transition-colors",
                    step >= s.n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted bg-background text-muted-foreground",
                  )}
                >
                  {step > s.n ? <Check className="h-4 w-4" /> : s.n}
                </span>
                <span className={cn("text-xs", step >= s.n ? "text-foreground" : "text-muted-foreground")}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("mx-2 h-0.5 flex-1 rounded", step > s.n ? "bg-primary" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8">
          {step === 1 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredServices.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setServiceId(s.id);
                    setProId(null);
                    setTime(null);
                  }}
                  className={cn(
                    "rounded-xl border p-5 text-left transition-all hover:border-primary/60",
                    serviceId === s.id ? "border-primary ring-2 ring-primary/20" : "border-border",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{s.name}</h3>
                    <span className="font-semibold text-primary">{formatMoney(s.price)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> 
                    {s.duration_min > 0 ? `${s.duration_min} min` : "Duración variable"}
                    {s.deposit > 0 && ` · Seña ${formatMoney(s.deposit)}`}
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {availablePros.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProId(p.id);
                    setTime(null);
                  }}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-5 text-left transition-all hover:border-primary/60",
                    proId === p.id ? "border-primary ring-2 ring-primary/20" : "border-border",
                  )}
                >
                  <span
                    className="grid h-12 w-12 place-items-center rounded-full font-semibold text-white"
                    style={{ backgroundColor: p.avatar_color }}
                  >
                    {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {availableDays.length === 0 ? (
                  <p className="text-sm text-muted-foreground w-full text-center py-4">Este profesional no tiene horarios configurados.</p>
                ) : (
                  availableDays.map((d) => {
                    const date = new Date(d + "T00:00:00");
                    return (
                      <button
                        key={d}
                        onClick={() => {
                          setDateISO(d);
                          setTime(null);
                        }}
                        className={cn(
                          "flex min-w-16 flex-col items-center rounded-xl border px-3 py-2 text-sm transition-colors",
                          dateISO === d ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/60",
                        )}
                      >
                        <span className="text-xs capitalize opacity-80">
                          {date.toLocaleDateString("es-AR", { weekday: "short" })}
                        </span>
                        <span className="text-lg font-semibold">{date.getDate()}</span>
                        <span className="text-xs capitalize opacity-80">
                          {date.toLocaleDateString("es-AR", { month: "short" })}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-5">
                {slots.length === 0 ? (
                  <p className="rounded-lg bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                    No hay horarios disponibles este día. Probá con otra fecha.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {slots.map((s) => (
                      <button
                        key={s.time}
                        onClick={() => setTime(s.time)}
                        className={cn(
                          "rounded-lg border py-2 px-1 text-sm font-medium transition-colors flex flex-col items-center justify-center",
                          time === s.time
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/60",
                        )}
                      >
                        <span>{s.time}</span>
                        {service.capacity > 1 && (
                          <span className={cn("text-[10px] mt-0.5", time === s.time ? "text-primary-foreground/80" : "text-muted-foreground")}>
                            {s.availableSpots} {s.availableSpots === 1 ? "cupo" : "cupos"}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && service && pro && time && (
            <Card>
              <CardContent className="space-y-4 p-6">
                <h3 className="font-semibold">Resumen de tu reserva</h3>
                <SummaryRow icon={Briefcase} label="Servicio" value={`${service.name}${service.duration_min > 0 ? ` · ${service.duration_min} min` : ""}`} />
                <SummaryRow icon={User} label="Profesional" value={`${pro.name} (${pro.title})`} />
                <SummaryRow icon={CalendarDays} label="Fecha y hora" value={`${formatDateLong(dateISO)} · ${time}`} />
                <div className="rounded-lg bg-muted/50 p-4 mt-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Precio total</span>
                    <span>{formatMoney(service.price)}</span>
                  </div>
                  {service.deposit > 0 && (
                    <div className="mt-1 flex items-center justify-between font-semibold">
                      <span>Seña a pagar ahora</span>
                      <span className="text-primary">{formatMoney(service.deposit)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Atrás
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Continuar <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={confirm} disabled={saving}>
              {saving ? "Confirmando…" : ((service?.deposit ?? 0) > 0 ? "Ir a pagar la seña" : "Confirmar reserva")} <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium capitalize">{value}</div>
      </div>
    </div>
  );
}
