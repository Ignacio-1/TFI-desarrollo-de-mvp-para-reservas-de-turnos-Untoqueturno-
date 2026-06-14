import { AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface SubscriptionBlockerProps {
  businessSlug: string;
  isAdmin: boolean;
}

export function SubscriptionBlocker({ businessSlug, isAdmin }: SubscriptionBlockerProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive mb-6">
        <Lock className="h-8 w-8" />
      </div>
      
      {isAdmin ? (
        <>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Tu periodo de prueba ha expirado</h1>
          <p className="max-w-md text-muted-foreground mb-8">
            Para continuar aceptando turnos y gestionando tu agenda, debes activar tu suscripción mensual.
          </p>
          <Button asChild size="lg" className="w-full max-w-sm">
            <Link to="/$businessSlug/admin/suscripcion" params={{ businessSlug }}>
              Activar Suscripción
            </Link>
          </Button>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Local inactivo</h1>
          <p className="max-w-md text-muted-foreground">
            Este negocio no está aceptando reservas en este momento. Por favor, comunícate directamente con el administrador.
          </p>
        </>
      )}
    </div>
  );
}
