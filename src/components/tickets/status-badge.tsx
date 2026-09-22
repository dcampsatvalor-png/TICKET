import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { TicketStatus } from "@/types/database";
import { STATUS_LABELS } from "@/types/database";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-sky-100 text-sky-900 border-sky-200",
  in_progress: "bg-amber-100 text-amber-900 border-amber-200",
  resolved: "bg-teal-100 text-teal-900 border-teal-200",
  closed: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

export { STATUS_STYLES };

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-md font-medium", STATUS_STYLES[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function RelativeTime({ date }: { date: string }) {
  return (
    <time dateTime={date} className="text-muted-foreground tabular-nums">
      {formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })}
    </time>
  );
}
