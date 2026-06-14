import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Mail, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Ingresar a mi panel — Un Toque Turno" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return toast.error("Ingresá tu email y contraseña");
    }
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      // Buscar el negocio principal del dueño
      const { data: roles, error: rolesError } = await supabase
        .from("business_roles")
        .select("businesses(slug)")
        .eq("user_id", authData.user.id)
        .eq("role", "owner")
        .limit(1);

      if (rolesError) throw rolesError;

      const slug = (roles?.[0]?.businesses as any)?.slug;
      
      if (slug) {
        toast.success("¡Bienvenido/a de nuevo!");
        navigate({ to: "/$businessSlug/admin", params: { businessSlug: slug } });
      } else {
        throw new Error("No se encontró un negocio asociado a esta cuenta.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al iniciar sesión";
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
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Acceso Administradores</h1>
      <p className="text-sm text-muted-foreground">Gestioná tu negocio en Un Toque Turno</p>

      <Card className="mt-8 w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Iniciar Sesión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9"
              />
            </div>
          </div>
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? "Ingresando…" : "Ingresar a mi panel"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link to="/" className="text-primary hover:underline">Volver al inicio</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
