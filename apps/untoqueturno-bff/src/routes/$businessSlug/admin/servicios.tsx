import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminHeader } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBusiness, useServices, useProfessionals } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import type { Service } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/$businessSlug/admin/servicios")({
  component: AdminServicios,
});

type Draft = {
  id?: string;
  name: string;
  description: string;
  duration_min: number;
  price: number;
  deposit: number;
  has_duration: boolean;
  has_deposit: boolean;
  has_capacity: boolean;
  capacity: number;
  assigned_professional_ids: string[];
  target_gender: "hombres" | "mujeres" | "ambos";
};

const empty: Draft = { name: "", description: "", duration_min: 30, price: 0, deposit: 0, has_duration: true, has_deposit: true, has_capacity: false, capacity: 1, assigned_professional_ids: [], target_gender: "ambos" };

function AdminServicios() {
  const { businessSlug } = useParams({ from: "/$businessSlug/admin/servicios" });
  const qc = useQueryClient();
  const { data: business } = useBusiness(businessSlug);
  const { data: services = [] } = useServices(business?.id);
  const { data: professionals = [] } = useProfessionals(business?.id);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty);

  const refetch = () => qc.invalidateQueries({ queryKey: ["services"] });

  const save = async () => {
    if (!draft.name.trim() || !business) return toast.error("Poné un nombre al servicio");
    let serviceId = draft.id;
    if (draft.id) {
      const { error } = await supabase
        .from("services")
        .update({
          name: draft.name,
          description: draft.description,
          duration_min: draft.has_duration ? draft.duration_min : 0,
          price: draft.price,
          deposit: draft.has_deposit ? draft.deposit : 0,
          target_gender: draft.target_gender,
          capacity: draft.has_capacity ? draft.capacity : 1,
        })
        .eq("id", draft.id);
      if (error) return toast.error(error.message);
      toast.success("Servicio actualizado");
    } else {
      const { data, error } = await supabase.from("services").insert({
        business_id: business.id,
        name: draft.name,
        description: draft.description,
        duration_min: draft.has_duration ? draft.duration_min : 0,
        price: draft.price,
        deposit: draft.has_deposit ? draft.deposit : 0,
        target_gender: draft.target_gender,
        capacity: draft.has_capacity ? draft.capacity : 1,
      }).select().single();
      if (error) return toast.error(error.message);
      serviceId = data.id;
      toast.success("Servicio creado");
    }

    // Actualizar profesionales asignados
    if (serviceId) {
      for (const p of professionals) {
        const shouldBeAssigned = draft.assigned_professional_ids.includes(p.id);
        const isAssigned = p.service_ids.includes(serviceId);
        
        if (shouldBeAssigned && !isAssigned) {
          await supabase.from("professionals").update({ service_ids: [...p.service_ids, serviceId] }).eq("id", p.id);
        } else if (!shouldBeAssigned && isAssigned) {
          await supabase.from("professionals").update({ service_ids: p.service_ids.filter(id => id !== serviceId) }).eq("id", p.id);
        }
      }
    }

    setOpen(false);
    refetch();
    qc.invalidateQueries({ queryKey: ["professionals"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("services").update({ active: false }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Servicio eliminado");
    refetch();
  };

  return (
    <>
      <AdminHeader
        title="Servicios"
        description="Definí los servicios, su duración, precio y seña."
        action={
          <Button onClick={() => { setDraft(empty); setOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Nuevo servicio
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead className="hidden md:table-cell">Duración</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Seña</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s: Service) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.name}</div>
                    <div className="hidden text-xs text-muted-foreground sm:block">{s.description}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{s.duration_min} min</TableCell>
                  <TableCell>{formatMoney(s.price)}</TableCell>
                  <TableCell className="text-primary">{formatMoney(s.deposit)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDraft({
                          id: s.id,
                          name: s.name,
                          description: s.description ?? "",
                          duration_min: s.duration_min || 30,
                          price: s.price,
                          deposit: s.deposit || 0,
                          has_duration: s.duration_min > 0,
                          has_deposit: s.deposit > 0,
                          has_capacity: (s.capacity || 1) > 1,
                          capacity: s.capacity || 1,
                          assigned_professional_ids: professionals.filter(p => p.service_ids.includes(s.id)).map(p => p.id),
                          target_gender: s.target_gender || "ambos",
                        });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={2}
              />
            </div>
            
            <div className="space-y-1.5">
              <Label>¿Para quién es este servicio?</Label>
              <div className="flex gap-2">
                <Button 
                  variant={draft.target_gender === "ambos" ? "default" : "outline"} 
                  onClick={() => setDraft({ ...draft, target_gender: "ambos" })}
                  className="flex-1"
                >
                  Unisex
                </Button>
                <Button 
                  variant={draft.target_gender === "hombres" ? "default" : "outline"} 
                  onClick={() => setDraft({ ...draft, target_gender: "hombres" })}
                  className="flex-1"
                >
                  Hombres
                </Button>
                <Button 
                  variant={draft.target_gender === "mujeres" ? "default" : "outline"} 
                  onClick={() => setDraft({ ...draft, target_gender: "mujeres" })}
                  className="flex-1"
                >
                  Mujeres
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="has_duration" className="cursor-pointer">¿Definir duración?</Label>
                  <Switch id="has_duration" checked={draft.has_duration} onCheckedChange={(c) => setDraft({ ...draft, has_duration: c })} />
                </div>
                {draft.has_duration && (
                  <div className="space-y-1.5 pl-2 border-l-2 border-muted">
                    <Label>Duración estimada (min)</Label>
                    <Input type="number" value={draft.duration_min} onChange={(e) => setDraft({ ...draft, duration_min: Number(e.target.value) })} />
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="has_deposit" className="cursor-pointer">¿Cobrar seña?</Label>
                  <Switch id="has_deposit" checked={draft.has_deposit} onCheckedChange={(c) => setDraft({ ...draft, has_deposit: c })} />
                </div>
                {draft.has_deposit && (
                  <div className="space-y-1.5 pl-2 border-l-2 border-muted">
                    <Label>Monto de la seña</Label>
                    <Input type="number" value={draft.deposit} onChange={(e) => setDraft({ ...draft, deposit: Number(e.target.value) })} />
                  </div>
                )}
              </div>
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="has_capacity" className="cursor-pointer">¿Servicio grupal / con cupos?</Label>
                  <Switch id="has_capacity" checked={draft.has_capacity} onCheckedChange={(c) => setDraft({ ...draft, has_capacity: c })} />
                </div>
                {draft.has_capacity && (
                  <div className="space-y-1.5 pl-2 border-l-2 border-muted">
                    <Label>Cantidad máxima de cupos por horario</Label>
                    <Input type="number" min="1" value={draft.capacity} onChange={(e) => setDraft({ ...draft, capacity: Math.max(1, Number(e.target.value)) })} />
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-1.5 pt-2">
              <Label>Precio total del servicio</Label>
              <Input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label>Profesionales asignados</Label>
              {professionals.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-3">No tenés profesionales creados.</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/${businessSlug}/admin/profesionales`}>Crear profesional</a>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {professionals.map((p) => (
                    <label key={p.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={draft.assigned_professional_ids.includes(p.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setDraft(d => ({
                            ...d,
                            assigned_professional_ids: checked 
                              ? [...d.assigned_professional_ids, p.id]
                              : d.assigned_professional_ids.filter(id => id !== p.id)
                          }));
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 place-items-center rounded-full text-xs text-white" style={{ backgroundColor: p.avatar_color }}>
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
