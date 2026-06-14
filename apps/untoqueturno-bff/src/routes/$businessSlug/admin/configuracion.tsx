import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Save, Info } from "lucide-react";
import { AdminHeader } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { BrandingStyle } from "@/components/BrandingStyle";
import { useBusiness } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useSearch } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { Business } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/$businessSlug/admin/configuracion")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      nuevo: search.nuevo === true || search.nuevo === "true",
    };
  },
  component: AdminConfig,
});

const palette = ["#14b8a6", "#0ea5e9", "#8b5cf6", "#f43f5e", "#f59e0b", "#22c55e", "#6366f1", "#0f172a"];
const emojis = ["💈", "✂️", "🩺", "💅", "🦷", "🐾", "💆", "🏋️"];

function AdminConfig() {
  const { businessSlug } = useParams({ from: "/$businessSlug/admin/configuracion" });
  const qc = useQueryClient();
  const { data: business } = useBusiness(businessSlug);
  const search = useSearch({ from: "/$businessSlug/admin/configuracion" });
  const [draft, setDraft] = useState<Business | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialogMode, setDialogMode] = useState<"welcome" | "guide" | null>(search.nuevo ? "welcome" : null);

  useEffect(() => {
    if (business) setDraft(business);
  }, [business]);

  if (!draft) return <div className="text-muted-foreground">Cargando…</div>;

  const set = (patch: Partial<Business>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        name: draft.name,
        description: draft.description,
        address: draft.address,
        primary_color: draft.primary_color,
        logo_emoji: draft.logo_emoji || "",
        whatsapp_number: draft.whatsapp_number || null,
      })
      .eq("id", draft.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configuración guardada");
    qc.invalidateQueries({ queryKey: ["business", businessSlug] });
  };

  return (
    <>
      <BrandingStyle business={draft} />
      <AdminHeader
        title="Configuración"
        description="Personalizá el branding de tu negocio. La vista previa se actualiza en vivo."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setDialogMode("guide")} title="Ver guía de configuración">
              <Info className="h-4 w-4" />
            </Button>
            <Button onClick={save} disabled={saving}>
              <Save className="mr-1 h-4 w-4" /> {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-1.5">
              <Label>Nombre del negocio</Label>
              <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea value={draft.description ?? ""} onChange={(e) => set({ description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input value={draft.address ?? ""} onChange={(e) => set({ address: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono de Empresa</Label>
              <Input 
                placeholder="" 
                value={draft.whatsapp_number ?? ""} 
                onChange={(e) => set({ whatsapp_number: e.target.value })} 
                aria-describedby="whatsapp-desc"
              />
              <p id="whatsapp-desc" className="text-xs text-muted-foreground">Si configuras tu número, tus clientes podrán contactarte rápidamente al terminar la reserva.</p>
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => set({ logo_emoji: "" })}
                  className={cn(
                    "flex h-11 items-center px-3 rounded-xl border text-sm transition-colors",
                    !draft.logo_emoji ? "border-primary bg-primary/10 font-medium" : "border-border hover:bg-muted",
                  )}
                >
                  Sin logo
                </button>
                {emojis.map((e) => (
                  <button
                    key={e}
                    onClick={() => set({ logo_emoji: e })}
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-xl border text-xl transition-colors",
                      draft.logo_emoji === e ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color principal</Label>
              <div className="flex flex-wrap items-center gap-2">
                {palette.map((c) => (
                  <button
                    key={c}
                    onClick={() => set({ primary_color: c })}
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-full ring-offset-2 transition-all",
                      draft.primary_color === c && "ring-2 ring-foreground",
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  >
                    {draft.primary_color === c && <Check className="h-4 w-4 text-white" />}
                  </button>
                ))}
                <label className="ml-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="color"
                    value={draft.primary_color}
                    onChange={(e) => set({ primary_color: e.target.value })}
                    className="h-9 w-9 cursor-pointer rounded border bg-transparent p-0"
                  />
                  Personalizado
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Label className="text-muted-foreground">Vista previa</Label>
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b bg-card p-4">
              <span className={cn("grid h-9 w-9 place-items-center rounded-xl", draft.logo_emoji ? "bg-primary/10 text-lg" : "bg-primary text-primary-foreground font-bold")}>
                {draft.logo_emoji || draft.name.charAt(0).toUpperCase()}
              </span>
              <span className="font-semibold">{draft.name}</span>
            </div>
            <CardContent className="space-y-4 p-5">
              <h3 className="text-lg font-bold">Reservá tu turno</h3>
              <Button className="w-full">Reservar ahora</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!dialogMode} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {dialogMode === "welcome" ? "¡Te damos la bienvenida! 🎉" : "Guía de configuración"}
            </DialogTitle>
            {dialogMode === "welcome" && (
              <DialogDescription className="text-base mt-2">
                Tu página web ya está lista. Para empezar a recibir reservas, seguí estos 3 simples pasos:
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-semibold text-sm">1</div>
              <div>
                <h4 className="font-medium">Personalizá tu marca</h4>
                <p className="text-sm text-muted-foreground">Elegí tu color y logo en esta pantalla de Configuración.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-semibold text-sm">2</div>
              <div>
                <h4 className="font-medium">Creá tus Servicios</h4>
                <p className="text-sm text-muted-foreground">Definí qué ofrecés, cuánto dura y su precio.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-semibold text-sm">3</div>
              <div>
                <h4 className="font-medium">Cargá tus Horarios</h4>
                <p className="text-sm text-muted-foreground">Ve a Profesionales. Si trabajás solo/a, el profesional serás vos mismo. Si sos un gimnasio, el "profesional" puede ser la "Sala de máquinas". ¡Adaptalo a tu negocio y cargá los horarios disponibles!</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setDialogMode(null)} className="w-full text-base">
              {dialogMode === "welcome" ? "¡Entendido, a configurar!" : "Cerrar guía"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
