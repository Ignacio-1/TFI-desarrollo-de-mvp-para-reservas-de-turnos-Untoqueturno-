import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Users, Store } from "lucide-react";
import { AdminHeader } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { statusLabels } from "@/lib/types";
import {
  useBusiness,
  useServices,
  useProfessionals,
  useAppointments,
} from "@/lib/queries";

export const Route = createFileRoute("/$businessSlug/admin/")({
  component: AdminCalendar,
});

const DAY_START = 8;
const DAY_END = 20;
const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function AdminCalendar() {
  const { businessSlug } = useParams({ from: "/$businessSlug/admin/" });
  const { data: business } = useBusiness(businessSlug);
  const { data: services = [] } = useServices(business?.id);
  const { data: professionals = [] } = useProfessionals(business?.id);
  const { data: appointments = [] } = useAppointments(business?.id);

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [proFilter, setProFilter] = useState<string>("all");

  const days = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  const visible = appointments.filter(
    (a) => a.status !== "cancelled" && (proFilter === "all" || a.professional_id === proFilter),
  );

  const weekLabel = `${days[0].toLocaleDateString("es-AR", { day: "numeric", month: "short" })} – ${days[5].toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`;

  const shift = (n: number) =>
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + n);
      return d;
    });

  const isoSet = new Set(days.map((d) => d.toISOString().slice(0, 10)));
  const weekItems = visible.filter((a) => isoSet.has(a.date));

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <span className="grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 text-primary mb-6 shadow-sm">
          <Store className="h-10 w-10" />
        </span>
        <h2 className="text-3xl font-bold tracking-tight">¡Te damos la bienvenida!</h2>
        <p className="mt-3 text-muted-foreground max-w-md text-base">
          Tu página web ya está lista, pero antes de que tus clientes puedan reservar, necesitás agregar los servicios que ofrecés.
        </p>
        <Button className="mt-8 h-12 px-8 text-base shadow-lg hover:shadow-primary/25 transition-all" asChild>
          <Link to={`/${businessSlug}/admin/servicios`}>Crear mi primer servicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title="Agenda"
        description="Vista semanal de turnos por profesional."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shift(-7)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-36 text-center text-sm font-medium">{weekLabel}</span>
            <Button variant="outline" size="icon" onClick={() => shift(7)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" /> Profesional:
        </span>
        <Chip active={proFilter === "all"} onClick={() => setProFilter("all")} label="Todos" />
        {professionals.map((p) => (
          <Chip
            key={p.id}
            active={proFilter === p.id}
            onClick={() => setProFilter(p.id)}
            label={p.name.split(" ")[0]}
            color={p.avatar_color}
          />
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[64px_repeat(6,1fr)] border-b bg-muted/30">
              <div className="p-2" />
              {days.map((d) => (
                <div key={d.toISOString()} className="border-l p-2 text-center">
                  <div className="text-xs capitalize text-muted-foreground">
                    {d.toLocaleDateString("es-AR", { weekday: "short" })}
                  </div>
                  <div className="text-sm font-semibold">{d.getDate()}</div>
                </div>
              ))}
            </div>

            {hours.map((h) => (
              <div key={h} className="grid grid-cols-[64px_repeat(6,1fr)] border-b last:border-0">
                <div className="p-2 text-right text-xs text-muted-foreground">
                  {String(h).padStart(2, "0")}:00
                </div>
                {days.map((d) => {
                  const iso = d.toISOString().slice(0, 10);
                  const cellAppts = visible.filter(
                    (a) => a.date === iso && Number(a.time.split(":")[0]) === h,
                  );
                  return (
                    <div key={iso + h} className="min-h-14 border-l p-1">
                      {cellAppts.map((a) => {
                        const pro = professionals.find((p) => p.id === a.professional_id);
                        const svc = services.find((s) => s.id === a.service_id);
                        return (
                          <div
                            key={a.id}
                            className="mb-1 rounded-md px-2 py-1 text-xs leading-tight text-white shadow-sm"
                            style={{ backgroundColor: pro?.avatar_color ?? "#14b8a6" }}
                            title={`${a.time.slice(0, 5)} · ${svc?.name} · ${a.client_name} · ${statusLabels[a.status]}`}
                          >
                            <div className="font-semibold truncate">
                              {a.time.slice(0, 5)} {a.client_name} {a.client_gender ? `(${a.client_gender})` : ""}
                            </div>
                            <div className="opacity-90 font-medium truncate mt-0.5">{svc?.name}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Turnos esta semana" value={String(weekItems.length)} />
        <Stat
          label="Pendientes de pago"
          value={String(appointments.filter((a) => a.status === "pending_payment").length)}
        />
        <Stat
          label="Ingresos por señas (sem.)"
          value={formatMoney(
            weekItems.reduce(
              (sum, a) => sum + (services.find((s) => s.id === a.service_id)?.deposit ?? 0),
              0,
            ),
          )}
        />
      </div>
    </>
  );
}

function Chip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {color && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />}
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
