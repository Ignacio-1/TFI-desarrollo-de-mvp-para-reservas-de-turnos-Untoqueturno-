import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminHeader } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBusiness, useServices, useProfessionals } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatDateShort, todayISO } from "@/lib/format";
import { type Professional } from "@/lib/types";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/$businessSlug/admin/profesionales")({
  component: AdminProfesionales,
});

const colors = ["#14b8a6", "#8b5cf6", "#f59e0b", "#ec4899", "#3b82f6", "#10b981"];

type DayDraft = { id: string; date: string; start: string; end: string };
type Draft = {
  id?: string;
  name: string;
  title: string;
  avatar_color: string;
  service_ids: string[];
  hours: DayDraft[];
};

const empty = (): Draft => ({ name: "", title: "", avatar_color: colors[0], service_ids: [], hours: [] });

function AdminProfesionales() {
  const { businessSlug } = useParams({ from: "/$businessSlug/admin/profesionales" });
  const qc = useQueryClient();
  const refetch = () => qc.invalidateQueries({ queryKey: ["professionals"] });

  const { data: business } = useBusiness(businessSlug);
  const { data: services = [] } = useServices(business?.id);
  const { data: professionals = [] } = useProfessionals(business?.id);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const openEdit = (p: Professional) => {
    const hours = (p.hours || []).map((h) => ({
      id: Math.random().toString(),
      date: h.date,
      start: h.start_time.slice(0, 5),
      end: h.end_time.slice(0, 5),
    }));
    setDraft({
      id: p.id,
      name: p.name,
      title: p.title ?? "",
      avatar_color: p.avatar_color,
      service_ids: [...p.service_ids],
      hours,
    });
    setSelectedDates(Array.from(new Set(hours.map(h => h.date))).map(d => new Date(d + "T12:00:00")));
    setOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim() || !business) return toast.error("Poné un nombre");

    let proId = draft.id;
    if (proId) {
      const { error } = await supabase
        .from("professionals")
        .update({ name: draft.name, title: draft.title, avatar_color: draft.avatar_color, service_ids: draft.service_ids })
        .eq("id", proId);
      if (error) return toast.error(error.message);
    } else {
      const { data, error } = await supabase
        .from("professionals")
        .insert({
          business_id: business.id,
          name: draft.name,
          title: draft.title,
          avatar_color: draft.avatar_color,
          service_ids: draft.service_ids,
        })
        .select()
        .single();
      if (error) return toast.error(error.message);
      proId = data.id;
    }

    // Reemplazar horarios
    await supabase.from("professional_hours").delete().eq("professional_id", proId);
    const rows = draft.hours.map((h) => ({ professional_id: proId, date: h.date, start_time: h.start, end_time: h.end }));
    if (rows.length) {
      const { error } = await supabase.from("professional_hours").insert(rows);
      if (error) return toast.error(error.message);
    }

    toast.success(draft.id ? "Profesional actualizado" : "Profesional agregado");
    setOpen(false);
    refetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("professionals").update({ active: false }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Profesional eliminado");
    refetch();
  };

  const updateBlock = (id: string, patch: Partial<DayDraft>) =>
    setDraft((d) => ({ ...d, hours: d.hours.map((h) => (h.id === id ? { ...h, ...patch } : h)) }));

  const addDateBlock = (date: string) => {
    setDraft((d) => ({ ...d, hours: [...d.hours, { id: Math.random().toString(), date, start: "09:00", end: "18:00" }] }));
  };

  const removeBlock = (id: string) =>
    setDraft((d) => ({ ...d, hours: d.hours.filter((h) => h.id !== id) }));

  const removeDate = (date: string) =>
    setDraft((d) => ({ ...d, hours: d.hours.filter((h) => h.date !== date) }));

  const toggleService = (id: string) =>
    setDraft((d) => ({
      ...d,
      service_ids: d.service_ids.includes(id) ? d.service_ids.filter((s) => s !== id) : [...d.service_ids, id],
    }));

  const uniqueDates = Array.from(new Set(draft.hours.map(h => h.date))).sort();

  const applyToAll = (sourceDate: string) => {
    const blocksToCopy = draft.hours.filter(h => h.date === sourceDate);
    if (!blocksToCopy.length) return;
    
    setDraft(d => {
      const newHours = [...d.hours];
      for (const targetDate of uniqueDates) {
        if (targetDate === sourceDate) continue;
        // Quitar los bloques viejos de esta fecha
        const filtered = newHours.filter(h => h.date !== targetDate);
        // Añadir los nuevos copiados
        const newBlocks = blocksToCopy.map(b => ({ ...b, id: Math.random().toString(), date: targetDate }));
        newHours.length = 0;
        newHours.push(...filtered, ...newBlocks);
      }
      return { ...d, hours: newHours };
    });
    toast.success("Horario copiado a todas las fechas");
  };

  return (
    <>
      <AdminHeader
        title="Profesionales"
        description="Gestioná el equipo, sus servicios y horarios."
        action={
          <Button onClick={() => { setDraft(empty()); setOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Agregar profesional
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {professionals.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
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
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.service_ids.map((id) => (
                  <span key={id} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    {services.find((s) => s.id === id)?.name ?? "—"}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {Array.from(new Set(p.hours?.map(h => h.date)))
                  .sort()
                  .slice(0, 3)
                  .map(d => formatDateShort(d))
                  .join(", ")}
                {(p.hours && new Set(p.hours.map(h => h.date)).size > 3) ? "..." : ""}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar profesional" : "Nuevo profesional"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Cargo</Label>
                <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setDraft({ ...draft, avatar_color: c })}
                    className={cn(
                      "h-7 w-7 rounded-full ring-offset-2 transition-all",
                      draft.avatar_color === c && "ring-2 ring-foreground",
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>



            <div className="space-y-4">
              <Label>Días de trabajo</Label>
              <div className="rounded-md border p-2 bg-card overflow-hidden flex justify-center">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={(dates) => {
                    setSelectedDates(dates || []);
                    // Sincronizar draft.hours
                    const dateStrings = (dates || []).map(d => {
                      const offset = d.getTimezoneOffset() * 60000;
                      return new Date(d.getTime() - offset).toISOString().split('T')[0];
                    });
                    
                    setDraft(d => {
                      // Eliminar horas de fechas deseleccionadas
                      const remainingHours = d.hours.filter(h => dateStrings.includes(h.date));
                      
                      // Agregar bloque default (09:00 - 18:00) a fechas nuevas
                      const existingDates = new Set(remainingHours.map(h => h.date));
                      const newDates = dateStrings.filter(ds => !existingDates.has(ds));
                      
                      const newHours = newDates.map(ds => ({
                        id: Math.random().toString(),
                        date: ds,
                        start: "09:00",
                        end: "18:00"
                      }));
                      
                      return { ...d, hours: [...remainingHours, ...newHours] };
                    });
                  }}
                  className="w-fit"
                />
              </div>

              <div className="space-y-4 mt-4">
                {uniqueDates.map((date) => {
                  const dayBlocks = draft.hours.filter(x => x.date === date);
                  return (
                    <div key={date} className="rounded-xl border p-4 bg-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold capitalize text-sm">{formatDateShort(date)}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => applyToAll(date)} className="h-8 px-2 text-xs">
                            Aplicar a todos
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => addDateBlock(date)} className="h-8 px-2 text-xs">
                            <Plus className="mr-1 h-3.5 w-3.5" /> Bloque
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {dayBlocks.map((block) => (
                          <div key={block.id} className="flex items-center gap-3">
                            <TimeSelect value={block.start} onChange={(v) => updateBlock(block.id, { start: v })} />
                            <span className="text-muted-foreground text-sm">a</span>
                            <TimeSelect value={block.end} onChange={(v) => updateBlock(block.id, { end: v })} />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeBlock(block.id)}
                              className="h-8 w-8 text-destructive opacity-70 hover:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {uniqueDates.length === 0 && (
                  <p className="text-sm text-muted-foreground">No has asignado ninguna fecha.</p>
                )}
              </div>
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

function TimeSelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [h, m] = value.split(":");

  const handleHour = (val: string) => {
    let num = parseInt(val, 10);
    if (isNaN(num)) num = 0;
    if (num > 23) num = 23;
    if (num < 0) num = 0;
    onChange(`${String(num).padStart(2, "0")}:${m}`);
  };

  const handleMin = (val: string) => {
    let num = parseInt(val, 10);
    if (isNaN(num)) num = 0;
    if (num > 59) num = 59;
    if (num < 0) num = 0;
    onChange(`${h}:${String(num).padStart(2, "0")}`);
  };

  return (
    <div className={cn("flex items-center gap-0.5 rounded-md border border-input bg-transparent px-2 h-9 shadow-sm focus-within:ring-1 focus-within:ring-ring", disabled && "opacity-50 cursor-not-allowed")}>
      <input 
        type="text" 
        inputMode="numeric"
        value={h} 
        disabled={disabled}
        onChange={e => onChange(`${e.target.value.replace(/\D/g, '').slice(0, 2)}:${m}`)}
        onBlur={e => handleHour(e.target.value)}
        className="w-6 bg-transparent text-center text-sm focus:outline-none"
        placeholder="00"
      />
      <span className="text-muted-foreground pb-0.5">:</span>
      <input 
        type="text" 
        inputMode="numeric"
        value={m} 
        disabled={disabled}
        onChange={e => onChange(`${h}:${e.target.value.replace(/\D/g, '').slice(0, 2)}`)}
        onBlur={e => handleMin(e.target.value)}
        className="w-6 bg-transparent text-center text-sm focus:outline-none"
        placeholder="00"
      />
    </div>
  );
}
