"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type {
  DevelopmentAnalytics,
  TicketAnalytics,
} from "@/lib/analytics/service";
import type { PeriodPreset } from "@/lib/analytics/period";
import { buildTicketsHref } from "@/lib/tickets/query";
import { buildDesarrollosHref } from "@/lib/developments/query";
import { LoadingOverlay } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { STATUS_STYLES } from "@/components/tickets/status-badge";
import type { TicketStatus } from "@/types/database";

const PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "month", label: "Este mes" },
  { value: "custom", label: "Personalizado" },
];

function buildReportesHref(params: {
  preset: PeriodPreset;
  from?: string;
  to?: string;
}): string {
  const q = new URLSearchParams();
  q.set("periodo", params.preset);
  if (params.preset === "custom") {
    if (params.from) q.set("desde", params.from);
    if (params.to) q.set("hasta", params.to);
  }
  return `/informes?${q.toString()}`;
}

function Kpi({
  label,
  value,
  hint,
  href,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs opacity-70">{hint}</p> : null}
    </>
  );

  const classes = cn(
    "rounded-xl border px-4 py-4 transition",
    className ?? "border-slate-200 bg-white text-slate-900",
    href &&
      "hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
  );

  if (!href) {
    return <div className={classes}>{body}</div>;
  }

  return (
    <Link href={href} className={classes}>
      {body}
    </Link>
  );
}

function AnalyticsBlock({
  title,
  description,
  analytics,
  listHref,
  listLabel,
  avgHint,
  accent = "teal",
  ticketsHref,
  desarrollosHref,
}: {
  title: string;
  description: string;
  analytics: TicketAnalytics | DevelopmentAnalytics;
  listHref: string;
  listLabel: string;
  avgHint: string;
  accent?: "teal" | "violet";
  ticketsHref?: (extra?: {
    status?: TicketStatus | "all";
    assignment?: "unassigned" | "all";
  }) => string;
  desarrollosHref?: (extra?: {
    status?: TicketStatus | "all";
    assignment?: "unassigned" | "all";
  }) => string;
}) {
  function hrefFor(extra: {
    status?: TicketStatus | "all";
    assignment?: "unassigned" | "all";
  } = {}) {
    if (ticketsHref) return ticketsHref(extra);
    if (desarrollosHref) return desarrollosHref(extra);
    return listHref;
  }

  const linkClass =
    accent === "violet"
      ? "text-sm font-medium text-violet-700 hover:text-violet-800"
      : "text-sm font-medium text-teal-700 hover:text-teal-800";

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-heading text-xl font-semibold text-slate-900">
            {title}
          </h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <Link href={listHref} className={linkClass}>
          {listLabel}
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Kpi
          label="Creadas"
          value={analytics.totals.created}
          hint="Total en el periodo"
          href={hrefFor()}
        />
        {analytics.byStatus.map((row) => (
          <Kpi
            key={row.status}
            label={row.label}
            value={row.count}
            href={hrefFor({ status: row.status })}
            className={STATUS_STYLES[row.status]}
          />
        ))}
        <Kpi
          label="Sin asignar"
          value={analytics.totals.unassignedCreated}
          hint="De las creadas"
          href={hrefFor({ assignment: "unassigned" })}
        />
        <Kpi label="Media / día" value={analytics.totals.avgPerDay} hint={avgHint} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4">
          <h3 className="font-heading text-lg font-semibold text-slate-900">
            Por agente
          </h3>
          <p className="text-sm text-slate-500">
            De las creadas en el periodo: asignadas, resueltas ahora y aún
            activas
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-3 font-medium">Agente</th>
                <th className="pb-2 pr-3 font-medium tabular-nums">Asignadas</th>
                <th className="pb-2 pr-3 font-medium tabular-nums">Resueltas</th>
                <th className="pb-2 font-medium tabular-nums">Activas</th>
              </tr>
            </thead>
            <tbody>
              {analytics.byAgent.map((row) => (
                <tr
                  key={row.agentId ?? "unassigned"}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-3 pr-3 font-medium text-slate-800">
                    {row.agentName}
                  </td>
                  <td className="py-3 pr-3 tabular-nums text-slate-700">
                    {row.assignedCreated}
                  </td>
                  <td className="py-3 pr-3 tabular-nums text-slate-700">
                    {row.resolved}
                  </td>
                  <td className="py-3 tabular-nums text-slate-700">{row.active}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function ReportsView({
  tickets,
  developments,
  preset,
  from,
  to,
}: {
  tickets: TicketAnalytics;
  developments: DevelopmentAnalytics;
  preset: PeriodPreset;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function navigate(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  function ticketsHref(extra: {
    status?: TicketStatus | "all";
    assignment?: "unassigned" | "all";
  } = {}) {
    return buildTicketsHref({
      status: extra.status ?? "all",
      assignment: extra.assignment ?? "all",
      periodo: preset,
      desde: from,
      hasta: to,
    });
  }

  function desarrollosHref(extra: {
    status?: TicketStatus | "all";
    assignment?: "unassigned" | "all";
  } = {}) {
    return buildDesarrollosHref({
      status: extra.status ?? "all",
      assignment: extra.assignment ?? "all",
      periodo: preset,
      desde: from,
      hasta: to,
    });
  }

  return (
    <div className="relative space-y-10">
      {pending ? <LoadingOverlay label="Actualizando reportes…" /> : null}

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Periodo
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                disabled={pending}
                onClick={() =>
                  navigate(
                    buildReportesHref({
                      preset: p.value,
                      from,
                      to,
                    })
                  )
                }
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition",
                  preset === p.value
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {preset === "custom" ? (
          <form
            className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              navigate(
                buildReportesHref({
                  preset: "custom",
                  from: String(fd.get("desde") || from),
                  to: String(fd.get("hasta") || to),
                })
              );
            }}
          >
            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium text-slate-500">Desde</span>
              <input
                type="date"
                name="desde"
                defaultValue={from}
                className="block rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium text-slate-500">Hasta</span>
              <input
                type="date"
                name="hasta"
                defaultValue={to}
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

        <p className="text-sm text-slate-600">
          {tickets.rangeLabel} · estado actual de lo creado en el periodo
        </p>
      </section>

      <AnalyticsBlock
        title="Incidencias"
        description="Soporte IT · incidencias@grupoatvalor.com"
        analytics={tickets}
        listHref={ticketsHref()}
        listLabel="Ir a incidencias"
        avgHint="Incidencias creadas"
        accent="teal"
        ticketsHref={ticketsHref}
      />

      <div className="border-t border-slate-200" />

      <AnalyticsBlock
        title="Desarrollos"
        description="Nuevas funcionalidades · desarrollos@tasacioneshipotecarias.com"
        analytics={developments}
        listHref={desarrollosHref()}
        listLabel="Ir a desarrollos"
        avgHint="Peticiones creadas"
        accent="violet"
        desarrollosHref={desarrollosHref}
      />
    </div>
  );
}
