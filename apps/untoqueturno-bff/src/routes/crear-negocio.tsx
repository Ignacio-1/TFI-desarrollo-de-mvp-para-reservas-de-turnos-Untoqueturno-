import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/crear-negocio")({
  head: () => ({ meta: [{ title: "Crear negocio — Un Toque Turno" }] }),
  component: CrearNegocio,
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function CrearNegocio() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessWhatsApp, setBusinessWhatsApp] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);

  const slug = slugify(businessName);

  const handleSubmit = async () => {
    if (!businessName.trim() || !email || !password || !phone) {
      toast.error("Completá todos los campos");
      return;
    }
    setLoading(true);
    try {
      // 1) Crear usuario
      const { data: signUp, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, phone: phone } },
      });
      if (signUpError) throw signUpError;
      const userId = signUp.user?.id;
      if (!userId) throw new Error("No se pudo crear el usuario");

      // 2) Crear negocio
      const { data: business, error: bizError } = await supabase
        .from("businesses")
        .insert({ name: businessName, slug, whatsapp_number: businessWhatsApp.trim() || phone.trim() })
        .select()
        .single();
      if (bizError) throw bizError;

      // 3) Asignar rol owner
      const { error: roleError } = await supabase
        .from("business_roles")
        .insert({ business_id: business.id, user_id: userId, role: "owner" });
      if (roleError) throw roleError;

      toast.success("¡Negocio creado! Bienvenido/a 🎉");
      navigate({ to: "/$businessSlug/admin/configuracion", params: { businessSlug: slug }, search: { nuevo: true } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al crear el negocio";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-16">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Store className="h-7 w-7" />
      </span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Creá tu negocio</h1>
      <p className="text-sm text-muted-foreground">Tu página de reservas en minutos</p>

      <Card className="mt-8 w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre del negocio</Label>
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            {slug && (
              <p className="text-xs text-muted-foreground">
                Tu link será: <span className="text-primary">un-toque.app/{slug}</span>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Tu nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Tu Teléfono Personal</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono de empresa</Label>
            <Input type="tel" value={businessWhatsApp} onChange={(e) => setBusinessWhatsApp(e.target.value)} placeholder="" aria-describedby="wa-desc" />
            <p id="wa-desc" className="text-xs text-muted-foreground">Si lo dejas vacío, usaremos tu teléfono personal.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Contraseña</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? "Creando…" : "Crear negocio"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link to="/" className="text-primary hover:underline">Volver al inicio</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
