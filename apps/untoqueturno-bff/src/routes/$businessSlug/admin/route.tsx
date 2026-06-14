import { createFileRoute, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { useBusiness } from "@/lib/queries";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { isSubscriptionActive } from "@/lib/subscription";
import { SubscriptionBlocker } from "@/components/SubscriptionBlocker";
import { useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/$businessSlug/admin")({
  head: () => ({ meta: [{ title: "Panel admin" }] }),
  component: AdminGuard,
});

function AdminGuard() {
  const { businessSlug } = useParams({ from: "/$businessSlug/admin" });
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { data: business } = useBusiness(businessSlug);

  // ¿El usuario tiene rol owner/admin en este negocio?
  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ["my-role", business?.id, user?.id],
    enabled: !!business?.id && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_roles")
        .select("role")
        .eq("business_id", business!.id)
        .eq("user_id", user!.id)
        .in("role", ["owner", "admin"])
        .maybeSingle();
      if (error) throw error;
      return data?.role ?? null;
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, businessSlug, navigate]);

  if (loading || !business || (user && roleLoading)) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Cargando…</div>;
  }

  if (user && !role) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <h1 className="text-xl font-semibold">No tenés acceso a este panel</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Solo los dueños o administradores del negocio pueden entrar.
          </p>
        </div>
      </div>
    );
  }

  // Subscription check
  const isBillingPage = location.pathname.endsWith("/suscripcion");
  
  if (!isSubscriptionActive(business) && !isBillingPage) {
    return <SubscriptionBlocker businessSlug={businessSlug} isAdmin={true} />;
  }

  return (
    <AdminLayout business={business}>
      <Outlet />
    </AdminLayout>
  );
}
