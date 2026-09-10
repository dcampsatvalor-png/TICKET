"use client";

import Link from "next/link";
import { Inbox } from "lucide-react";
import type { AssignmentFilter, StatusFilter, TicketListItem } from "@/types/database";
import { RelativeTime, StatusBadge } from "@/components/tickets/status-badge";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "open", label: "Abierto" },
  { value: "in_progress", label: "En proceso" },
  { value: "resolved", label: "Resuelto" },
];

const ASSIGNMENT_OPTIONS: { value: AssignmentFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "mine", label: "Mis tickets" },
  { value: "unassigned", label: "Sin asignar" },
];

function FilterChip({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {children}
    </Link>
  );
}

export function TicketFilters({
  status,
  assignment,
}: {
  status: StatusFilter;
  assignment: AssignmentFilter;
}) {
  function hrefFor(nextStatus: StatusFilter, nextAssignment: AssignmentFilter) {
    const params = new URLSearchParams();
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (nextAssignment !== "all") params.set("assignment", nextAssignment);
    const q = params.toString();
    return q ? `/tickets?${q}` : "/tickets";
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Estado</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              active={status === opt.value}
              href={hrefFor(opt.value, assignment)}
            >
              {opt.label}
            </FilterChip>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Asignación</p>
        <div className="flex flex-wrap gap-2">
          {ASSIGNMENT_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              active={assignment === opt.value}
              href={hrefFor(status, opt.value)}
            >
              {opt.label}
            </FilterChip>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TicketList({ tickets }: { tickets: TicketListItem[] }) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
        <Inbox className="mb-3 size-8 text-slate-400" />
        <p className="font-medium text-slate-800">No hay tickets con estos filtros</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Prueba a cambiar el estado o la asignación, o espera a que lleguen nuevos correos.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
      {tickets.map((ticket, index) => (
        <li
          key={ticket.id}
          className="animate-in fade-in slide-in-from-bottom-1"
          style={{ animationDelay: `${Math.min(index, 8) * 40}ms`, animationFillMode: "both" }}
        >
          <Link
            href={`/tickets/${ticket.id}`}
            className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
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
          </Link>
        </li>
      ))}
    </ul>
  );
}
