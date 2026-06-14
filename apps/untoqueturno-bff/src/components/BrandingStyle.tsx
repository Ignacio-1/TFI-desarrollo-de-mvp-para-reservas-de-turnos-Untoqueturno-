import { useEffect } from "react";
import type { Business } from "@/lib/types";

/**
 * Aplica el color primario del negocio al tema en vivo (multi-tenant branding).
 */
export function BrandingStyle({ business }: { business: Business | null | undefined }) {
  useEffect(() => {
    if (typeof document === "undefined" || !business) return;
    const root = document.documentElement.style;
    root.setProperty("--primary", business.primary_color);
    root.setProperty("--ring", business.primary_color);
    root.setProperty("--sidebar-primary", business.primary_color);
  }, [business?.primary_color]);
  return null;
}
