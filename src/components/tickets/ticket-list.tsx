"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Inbox } from "lucide-react";
import type { AssignmentFilter, StatusFilter, TicketListItem } from "@/types/database";
import type { PeriodPreset } from "@/lib/analytics/period";
import { buildTicketsHref } from "@/lib/tickets/query";
import { RelativeTime, StatusBadge } from "@/components/tickets/status-badge";
import { LoadingOverlay } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "open", label: "Abierto" },
  { value: "in_progress", label: "En proceso" },
  { value: "resolved", label: "Resuelto" },
  { value: "closed", label: "Cerrado" },
  { value: "cancelled", label: "Anulado" },
];

const ASSIGNMENT_OPTIONS: { value: AssignmentFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "mine", label: "Mis tickets" },
  { value: "unassigned", label: "Sin asignar" },
];

const PERIOD_OPTIONS: { value: PeriodPreset | "all"; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "today", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "month", label: "Este mes" },
  { value: "custom", label: "Personalizado" },
];

function FilterChip({
  active,
  href,
  disabled,
  onNavigate,
  children,
}: {
  active: boolean;
  href: string;
  disabled?: boolean;
  onNavigate: (href: string, label: string) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled || active}
      onClick={() => onNavigate(href, String(children))}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900",
        disabled && !active && "cursor-wait opacity-60",
        active && "cursor-default"
      )}
    >
      {children}
    </button>
  );
}

export function TicketFilters({
  status,
  assignment,
  periodo,
  desde,
  hasta,
  rangeLabel,
}: {
  status: StatusFilter;
  assignment: AssignmentFilter;
  periodo: PeriodPreset | "all";
  desde: string;
  hasta: string;
  rangeLabel: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pendingLabel = "Aplicando filtros…";

  function hrefFor(next: {
    status?: StatusFilter;
    assignment?: AssignmentFilter;
    periodo?: PeriodPreset | "all";
    desde?: string;
    hasta?: string;
  }) {
    return buildTicketsHref({
      status: next.status ?? status,
      assignment: next.assignment ?? assignment,
      periodo: next.periodo ?? periodo,
      desde: next.desde ?? desde,
      hasta: next.hasta ?? hasta,
    });
  }

  function onNavigate(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <>
      {isPending && <LoadingOverlay label={pendingLabel} />}
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Periodo
          </p>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                active={periodo === opt.value}
                href={hrefFor({ periodo: opt.value })}
                disabled={isPending}
                onNavigate={onNavigate}
              >
                {opt.label}
              </FilterChip>
            ))}
          </div>
          {periodo === "custom" ? (
            <form
              className="flex flex-wrap items-end gap-3 pt-1"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                onNavigate(
                  hrefFor({
                    periodo: "custom",
                    desde: String(fd.get("desde") || desde),
                    hasta: String(fd.get("hasta") || hasta),
                  })
                );
              }}
            >
              <label className="space-y-1 text-sm">
                <span className="text-xs font-medium text-slate-500">Desde</span>
                <input
                  type="date"
                  name="desde"
                  defaultValue={desde}
                  className="block rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs font-medium text-slate-500">Hasta</span>
                <input
                  type="date"
                  name="hasta"
                  defaultValue={hasta}
                  className="block rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                />
              </label>
              <button
                type="submit"
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
              >
                Aplicar
              </button>
            </form>
          ) : null}
          {rangeLabel ? (
            <p className="text-sm text-slate-500">
              Creadas entre {rangeLabel}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Estado
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  active={status === opt.value}
                  href={hrefFor({ status: opt.value })}
                  disabled={isPending}
                  onNavigate={onNavigate}
                >
                  {opt.label}
                </FilterChip>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Asignación
            </p>
            <div className="flex flex-wrap gap-2">
              {ASSIGNMENT_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  active={assignment === opt.value}
                  href={hrefFor({ assignment: opt.value })}
                  disabled={isPending}
                  onNavigate={onNavigate}
                >
                  {opt.label}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function TicketList({ tickets }: { tickets: TicketListItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function openTicket(id: string) {
    startTransition(() => {
      router.push(`/tickets/${id}`);
    });
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
        <Inbox className="mb-3 size-8 text-slate-400" />
        <p className="font-medium text-slate-800">No hay tickets con estos filtros</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Prueba a cambiar el periodo, el estado o la asignación, o espera a que
          lleguen nuevos correos.
        </p>
      </div>
    );
  }

  return (
    <>
      {isPending && <LoadingOverlay label="Abriendo ticket…" />}
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        {tickets.map((ticket, index) => (
          <li
            key={ticket.id}
            className="animate-in fade-in slide-in-from-bottom-1"
            style={{
              animationDelay: `${Math.min(index, 8) * 40}ms`,
              animationFillMode: "both",
            }}
          >
            <button
              type="button"
              onClick={() => openTicket(ticket.id)}
              disabled={isPending}
              className="flex w-full flex-col gap-2 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/80 disabled:cursor-wait sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-slate-500">
                    #{ticket.ticket_number}
                  </span>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="truncate font-medium text-slate-900">{ticket.subject}</p>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {ticket.sender_name
                    ? `${ticket.sender_name} · ${ticket.sender_email}`
                    : ticket.sender_email}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-sm">
                <span className="hidden text-slate-500 sm:inline">
                  {ticket.assignee?.full_name ?? "Sin asignar"}
                </span>
                <RelativeTime date={ticket.updated_at} />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
