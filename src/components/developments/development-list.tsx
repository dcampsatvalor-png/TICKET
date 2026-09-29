"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Lightbulb } from "lucide-react";
import type { DevelopmentRequestListItem, StatusFilter } from "@/types/database";
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

function buildHref(status: StatusFilter): string {
  if (status === "all") return "/desarrollos";
  return `/desarrollos?status=${status}`;
}

export function DevelopmentFilters({ status }: { status: StatusFilter }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onNavigate(href: string) {
    startTransition(() => router.push(href));
  }

  return (
    <>
      {isPending && <LoadingOverlay label="Aplicando filtros…" />}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={isPending || status === opt.value}
            onClick={() => onNavigate(buildHref(opt.value))}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              status === opt.value
                ? "bg-violet-700 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </>
  );
}

export function DevelopmentList({
  requests,
}: {
  requests: DevelopmentRequestListItem[];
}) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-violet-200 bg-white/60 px-6 py-16 text-center">
        <Lightbulb className="mb-3 size-8 text-violet-400" />
        <p className="font-medium text-slate-800">No hay peticiones con estos filtros</p>
        <p className="mt-1 max-w-md text-sm text-slate-500">
          Las solicitudes de nuevo desarrollo llegan por correo a{" "}
          <span className="font-medium">desarrollos@tasacioneshipotecarias.com</span>.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
      {requests.map((req, index) => (
        <li
          key={req.id}
          className="animate-in fade-in slide-in-from-bottom-1"
          style={{
            animationDelay: `${Math.min(index, 8) * 40}ms`,
            animationFillMode: "both",
          }}
        >
          <Link
            href={`/desarrollos/${req.id}`}
            className="flex w-full flex-col gap-2 px-4 py-3.5 text-left transition-colors hover:bg-violet-50/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-violet-600">
                  D#{req.request_number}
                </span>
                <StatusBadge status={req.status} />
              </div>
              <p className="truncate font-medium text-slate-900">{req.subject}</p>
              <p className="mt-0.5 truncate text-sm text-slate-500">
                {req.sender_name
                  ? `${req.sender_name} · ${req.sender_email}`
                  : req.sender_email}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4 text-sm">
              <span className="hidden text-slate-500 sm:inline">
                {req.assignee?.full_name ?? "Sin asignar"}
              </span>
              <RelativeTime date={req.updated_at} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
