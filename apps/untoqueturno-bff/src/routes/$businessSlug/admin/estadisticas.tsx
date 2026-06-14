import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { AdminHeader } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBusiness, useAppointments, useServices } from "@/lib/queries";
import { formatMoney, todayISO } from "@/lib/format";
import { BarChart3, Users, DollarSign, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$businessSlug/admin/estadisticas")({
  component: AdminEstadisticas,
});

function AdminEstadisticas() {
  const { businessSlug } = useParams({ from: "/$businessSlug/admin/estadisticas" });
  const { data: business } = useBusiness(businessSlug);
  const { data: appointments = [] } = useAppointments(business?.id);
  const { data: services = [] } = useServices(business?.id);

  const [dateFilter, setDateFilter] = useState(() => todayISO());

  const dayAppointments = appointments.filter((a) => a.date === dateFilter && a.status !== "cancelled");
  
  // Calcular métricas del día
  const totalTurnos = dayAppointments.length;
  
  // Calcular nuevos clientes del día (cuyo primer turno es hoy)
  const previousAppointments = appointments.filter((a) => a.date < dateFilter && a.status !== "cancelled");
  const previousClientPhones = new Set(previousAppointments.map((a) => a.client_phone));
  
  let nuevosClientes = 0;
  let ingresosDelDia = 0;
  
  const dayAppointmentsWithDetails = dayAppointments.map(app => {
    const service = services.find((s) => s.id === app.service_id);
    const payments = app.payments || [];
    
    // Determinar si es cliente nuevo
    const isNewClient = !previousClientPhones.has(app.client_phone);
    if (isNewClient) nuevosClientes++;

    // Lógica de pagos e ingresos
    let amountPaid = 0;
    let paymentMethod = "Pendiente";
    
    if (payments.length > 0) {
      const mpPayment = payments.find((p: any) => p.method === "mercadopago" && p.status === "approved");
      if (mpPayment) {
        amountPaid += mpPayment.amount;
        paymentMethod = "Mercado Pago";
      }
    }
    
    // Si el administrador lo marcó como cobrado, sumamos el faltante
    if (app.is_paid && service) {
      if (paymentMethod === "Mercado Pago") {
        // Significa que pagó seña por MP y el resto en efectivo
        amountPaid += (service.price - amountPaid);
        paymentMethod = "Mixto (MP + Efectivo)";
      } else {
        amountPaid = service.price;
        paymentMethod = "Efectivo";
      }
    }

    ingresosDelDia += amountPaid;

    return {
      ...app,
      serviceName: service?.name || "Servicio eliminado",
      price: service?.price || 0,
      isNewClient,
      paymentMethod,
      amountPaid
    };
  });

  return (
    <>
      <AdminHeader
        title="Estadísticas"
        description="Analizá el rendimiento de tu negocio día a día."
      />

      <div className="mb-6 flex items-center gap-3">
        <label htmlFor="date" className="text-sm font-medium">Filtrar por día:</label>
        <Input 
          id="date" 
          type="date" 
          value={dateFilter} 
          onChange={(e) => setDateFilter(e.target.value)} 
          className="w-auto"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos del Día</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(ingresosDelDia)}</div>
            <p className="text-xs text-muted-foreground mt-1">Dinero cobrado</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Turnos Totales</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTurnos}</div>
            <p className="text-xs text-muted-foreground mt-1">Reservas para hoy</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Nuevos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nuevosClientes}</div>
            <p className="text-xs text-muted-foreground mt-1">Personas que vienen por 1ra vez</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Desglose de Turnos</CardTitle>
        </CardHeader>
        <CardContent>
          {dayAppointmentsWithDetails.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
              No hay turnos registrados para esta fecha.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Hora</th>
                    <th className="pb-3 font-medium">Cliente</th>
                    <th className="pb-3 font-medium">Servicio</th>
                    <th className="pb-3 font-medium">Cobrado</th>
                    <th className="pb-3 font-medium">Método</th>
                  </tr>
                </thead>
                <tbody>
                  {dayAppointmentsWithDetails.map((app) => (
                    <tr key={app.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3">{app.time.slice(0, 5)}</td>
                      <td className="py-3">
                        <div className="font-medium">{app.client_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          {app.client_phone}
                          {app.isNewClient && (
                            <span className="bg-primary/10 text-primary px-1.5 rounded-sm text-[10px] font-semibold">
                              NUEVO
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">{app.serviceName}</td>
                      <td className="py-3 font-medium">{formatMoney(app.amountPaid)}</td>
                      <td className="py-3">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap",
                          app.paymentMethod.includes("Pendiente") 
                            ? "bg-yellow-500/10 text-yellow-600" 
                            : "bg-primary/10 text-primary"
                        )}>
                          {app.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
