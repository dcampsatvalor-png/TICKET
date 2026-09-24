import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { TicketFilters, TicketList } from "@/components/tickets/ticket-list";
import { LiveRefresh } from "@/components/live-refresh";
import { getCurrentProfile, listTickets } from "@/lib/tickets/service";
import { isDemoMode } from "@/lib/env";
import {
  formatRangeLabel,
  madridDateKey,
  resolveOptionalDateRange,
  type PeriodPreset,
} from "@/lib/analytics/period";
import type { AssignmentFilter, StatusFilter } from "@/types/database";
import { Suspense } from "react";

function parseStatus(value: string | undefined): StatusFilter {
  if (
    value === "open" ||
    value === "in_progress" ||
    value === "resolved" ||
    value === "closed" ||
    value === "cancelled" ||
    value === "active" ||
    value === "done"
  ) {
    return value;
  }
  return "all";
}

function parseAssignment(value: string | undefined): AssignmentFilter {
  if (value === "mine" || value === "unassigned" || value === "all") return value;
  return "all";
}

function parsePeriodo(value: string | undefined): PeriodPreset | "all" {
  if (
    value === "today" ||
    value === "7d" ||
    value === "30d" ||
    value === "month" ||
    value === "custom"
  ) {
    return value;
  }
  return "all";
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    assignment?: string;
    periodo?: string;
    desde?: string;
    hasta?: string;
  }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile && !isDemoMode()) {
    redirect("/login");
  }

  const params = await searchParams;
  const status = parseStatus(params.status);
  const assignment = parseAssignment(params.assignment);
  const periodo = parsePeriodo(params.periodo);
  const range = resolveOptionalDateRange({
    preset: periodo,
    from: params.desde,
    to: params.hasta,
  });
  const desde = range ? madridDateKey(range.from) : madridDateKey(new Date());
  const hasta = range ? madridDateKey(range.to) : madridDateKey(new Date());
  const rangeLabel = range ? formatRangeLabel(range.from, range.to) : null;

  const tickets = await listTickets({
    status,
    assignment,
    createdFrom: range?.from ?? null,
    createdTo: range?.to ?? null,
  });
  const liveRealtime = !isDemoMode();

  return (
    <div className="min-h-screen">
      <AppHeader profile={profile} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-900">
              Tickets
            </h1>
            <p className="max-w-xl text-slate-600">
              Gestiona incidencias entrantes por correo y responde desde el panel.
            </p>
          </div>
          <LiveRefresh realtime={liveRealtime} />
        </div>

        <div className="mb-6">
          <Suspense fallback={null}>
            <TicketFilters
              status={status}
              assignment={assignment}
              periodo={periodo}
              desde={desde}
              hasta={hasta}
              rangeLabel={rangeLabel}
            />
          </Suspense>
        </div>

        <Suspense
          fallback={
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
              Cargando tickets…
            </div>
          }
        >
          <TicketList tickets={tickets} />
        </Suspense>
      </main>
    </div>
  );
}
