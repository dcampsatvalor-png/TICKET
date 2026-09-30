import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { TicketPriority, TicketStatus } from "@/types/database";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/types/database";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-sky-100 text-sky-900 border-sky-200",
  in_progress: "bg-amber-100 text-amber-900 border-amber-200",
  resolved: "bg-teal-100 text-teal-900 border-teal-200",
  closed: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-indigo-100 text-indigo-900 border-indigo-200",
  high: "bg-orange-100 text-orange-900 border-orange-300",
};

export { STATUS_STYLES, PRIORITY_STYLES };

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

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-md font-medium", PRIORITY_STYLES[priority])}
    >
      {PRIORITY_LABELS[priority]}
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
