import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  ExternalLink,
  LayoutGrid,
  Briefcase,
  Settings,
  Users,
  ListTodo,
  BarChart3,
  CreditCard,
} from "lucide-react";
import { BrandingStyle } from "@/components/BrandingStyle";
import { AIChat } from "@/components/AIChat";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Business } from "@/lib/types";

export function AdminLayout({
  business,
  children,
}: {
  business: Business;
  children: React.ReactNode;
}) {
  const slug = business.slug;
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const navItems = [
    { to: `/${slug}/admin`, label: "Agenda", icon: CalendarDays, exact: true },
    { to: `/${slug}/admin/turnos`, label: "Turnos", icon: ListTodo, exact: false },
    { to: `/${slug}/admin/servicios`, label: "Servicios", icon: Briefcase, exact: false },
    { to: `/${slug}/admin/profesionales`, label: "Profesionales", icon: Users, exact: false },
    { to: `/${slug}/admin/estadisticas`, label: "Estadísticas", icon: BarChart3, exact: false },
    { to: `/${slug}/admin/configuracion`, label: "Configuración", icon: Settings, exact: false },
    { to: `/${slug}/admin/suscripcion`, label: "Suscripción", icon: CreditCard, exact: false },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      <BrandingStyle business={business} />
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-lg">
            {business.logo_emoji}
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{business.name}</div>
            <div className="text-xs text-muted-foreground">Panel admin</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <Button asChild variant="outline" className="w-full justify-start">
            <Link to={`/${slug}`}>
              <ExternalLink className="mr-2 h-4 w-4" /> Ver sitio cliente
            </Link>
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 overflow-x-auto border-b bg-background px-3 py-2 md:hidden">
          <LayoutGrid className="h-4 w-4 shrink-0 text-primary" />
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </header>
        <main className="flex-1 p-4 pb-24 md:p-8">{children}</main>
      </div>
      <AIChat />
    </div>
  );
}

export function AdminHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
