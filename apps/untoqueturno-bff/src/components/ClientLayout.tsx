import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, LogOut, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { BrandingStyle } from "@/components/BrandingStyle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Business } from "@/lib/types";

export function ClientLayout({
  business,
  children,
}: {
  business: Business;
  children: React.ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const slug = business.slug;
  
  const [client, setClient] = useState<{ name: string; phone: string; gender: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`turnoapp_client_${slug}`);
      if (saved) setClient(JSON.parse(saved));
    } catch {}
  }, [slug]);

  const signOutClient = () => {
    localStorage.removeItem(`turnoapp_client_${slug}`);
    setClient(null);
    window.location.href = `/${slug}`;
  };

  const links = [
    { to: `/${slug}`, label: "Inicio" },
    { to: `/${slug}/mis-turnos`, label: "Mis turnos" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <BrandingStyle business={business} />
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to={`/${slug}`} className="flex items-center gap-2 font-semibold">
            <span className={cn("grid h-9 w-9 place-items-center rounded-xl", business.logo_emoji ? "bg-primary/10 text-lg" : "bg-primary text-primary-foreground font-bold")}>
              {business.logo_emoji || business.name.charAt(0).toUpperCase()}
            </span>
            <span className="text-lg tracking-tight">{business.name}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  pathname === l.to
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {client ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{client.name}</span>
                <Button variant="ghost" size="icon" onClick={signOutClient} aria-label="Salir">
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ) : null}
            <Button asChild>
              <Link to={`/${slug}`}>
                <CalendarDays className="mr-1 h-4 w-4" /> Reservar
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menú"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {open && (
          <div className="border-t bg-background px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium",
                    pathname === l.to ? "bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className={cn("inline-grid h-6 w-6 place-items-center rounded", business.logo_emoji ? "text-base" : "bg-primary text-xs font-bold text-primary-foreground")}>
              {business.logo_emoji || business.name.charAt(0).toUpperCase()}
            </span> {business.name}
          </span>
          <span>Potenciado por Un Toque Turno</span>
        </div>
      </footer>
    </div>
  );
}
