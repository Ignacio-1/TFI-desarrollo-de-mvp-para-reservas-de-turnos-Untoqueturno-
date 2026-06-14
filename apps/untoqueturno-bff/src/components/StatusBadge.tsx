import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusLabels, type AppointmentStatus } from "@/lib/types";

const styles: Record<AppointmentStatus, string> = {
  confirmed: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  pending_payment: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  cancelled: "bg-red-100 text-red-700 hover:bg-red-100",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-none font-medium", styles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}
