import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, CreditCard, Store, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Un Toque Turno — Sistema de turnos para tu negocio" },
      {
        name: "description",
        content:
          "Creá tu página de reservas en minutos. Cobrá señas con Mercado Pago y gestioná tu agenda desde un panel simple.",
      },
    ],
  }),
  component: PlatformLanding,
});

const features = [
  { icon: CalendarCheck, title: "Agenda online", text: "Tus clientes reservan solos, 24/7." },
  { icon: CreditCard, title: "Señas con Mercado Pago", text: "Asegurá la asistencia cobrando una seña." },
  { icon: Store, title: "Tu marca", text: "Página propia con tu nombre, color y logo." },
];

function PlatformLanding() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <span className="text-lg font-bold tracking-tight">👆 Un Toque Turno</span>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link to="/login">Ingresar</Link>
          </Button>
          <Button asChild>
            <Link to="/crear-negocio">Crear mi negocio</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Turnos online para tu negocio,{" "}
          <span className="text-primary">en un toque</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Barberías, estéticas, consultorios y más. Creá tu página de reservas,
          cobrá señas y gestioná tu agenda sin complicaciones.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/crear-negocio">
              Empezar gratis <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="border-none bg-muted/40 shadow-none">
              <CardContent className="p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-24 border-t">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Un único plan. Todo incluido.</h2>
          <p className="mt-4 text-lg text-muted-foreground">Empezá a usar el sistema hoy. Tenés 15 días gratis para probarlo.</p>
        </div>
        
        <div className="mx-auto max-w-md">
          <Card className="border-primary shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 rounded-bl-xl font-medium text-sm">
              Más elegido
            </div>
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold">Plan Profesional</h3>
              <div className="mt-4 flex items-baseline text-5xl font-extrabold">
                $20.000
                <span className="ml-1 text-xl font-medium text-muted-foreground">/mes</span>
              </div>
              <p className="mt-4 text-muted-foreground">ARS final. Cancela cuando quieras.</p>
              
              <ul className="mt-8 space-y-4">
                {[
                  "Turnos ilimitados",
                  "Integración con Mercado Pago",
                  "Avisos por WhatsApp",
                  "Tu propia página web (un-toque.app/tu-local)",
                  "Soporte prioritario",
                  "Panel de estadísticas",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8">
                <Button asChild size="lg" className="w-full text-lg h-12">
                  <Link to="/crear-negocio">
                    Iniciar mis 15 días gratis
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t bg-muted/40 py-12">
        <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Un Toque Turnos. Todos los derechos reservados.
            </p>
          </div>
          <div className="flex gap-4">
            <a 
              href="https://wa.me/5491100000000?text=Hola,%20necesito%20ayuda%20con%20Un%20Toque%20Turno" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              ¿Necesitas ayuda? Contáctanos
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
