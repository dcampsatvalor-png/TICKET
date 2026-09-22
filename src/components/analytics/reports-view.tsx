"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { TicketAnalytics } from "@/lib/analytics/service";
import type { BucketGranularity, PeriodPreset } from "@/lib/analytics/period";
import { LoadingOverlay } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/tickets/status-badge";

const PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "month", label: "Este mes" },
  { value: "custom", label: "Personalizado" },
];

const GRANULARITIES: { value: BucketGranularity; label: string }[] = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];

function buildHref(params: {
  preset: PeriodPreset;
  granularity: BucketGranularity;
  from?: string;
  to?: string;
}): string {
  const q = new URLSearchParams();
  q.set("periodo", params.preset);
  q.set("agrupar", params.granularity);
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
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-heading text-3xl font-semibold tabular-nums text-slate-900">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function SeriesChart({ series }: { series: TicketAnalytics["series"] }) {
  const max = Math.max(1, ...series.map((b) => Math.max(b.created, b.resolved)));
  if (series.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No hay datos en este periodo.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-teal-600" /> Creadas
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-sky-500" /> Resueltas / cerradas
        </span>
      </div>
      <div className="flex items-end gap-1.5 overflow-x-auto pb-1 pt-2 sm:gap-2">
        {series.map((bucket) => (
          <div
            key={bucket.key}
            className="flex min-w-[2.25rem] flex-1 flex-col items-center gap-1"
            title={`${bucket.label}: ${bucket.created} creadas, ${bucket.resolved} resueltas`}
          >
            <div className="flex h-36 w-full items-end justify-center gap-0.5">
              <div
                className="w-2.5 rounded-t bg-teal-600 sm:w-3"
                style={{ height: `${(bucket.created / max) * 100}%`, minHeight: bucket.created ? 4 : 0 }}
              />
              <div
                className="w-2.5 rounded-t bg-sky-500 sm:w-3"
                style={{ height: `${(bucket.resolved / max) * 100}%`, minHeight: bucket.resolved ? 4 : 0 }}
              />
            </div>
            <span className="max-w-[3.5rem] truncate text-center text-[10px] leading-tight text-slate-500">
              {bucket.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportsView({
  analytics,
  preset,
  granularity,
  from,
  to,
}: {
  analytics: TicketAnalytics;
  preset: PeriodPreset;
  granularity: BucketGranularity;
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

  return (
    <div className="relative space-y-8">
      {pending ? <LoadingOverlay label="Actualizando informes…" /> : null}

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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
                      buildHref({
                        preset: p.value,
                        granularity,
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

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Agrupar por
            </p>
            <div className="flex flex-wrap gap-2">
              {GRANULARITIES.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    navigate(
                      buildHref({
                        preset,
                        granularity: g.value,
                        from,
                        to,
                      })
                    )
                  }
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition",
                    granularity === g.value
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {preset === "custom" ? (
          <form
            className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              navigate(
                buildHref({
                  preset: "custom",
                  granularity,
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

        <p className="text-sm text-slate-600">{analytics.rangeLabel}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Creadas" value={analytics.totals.created} hint="En el periodo" />
        <Kpi
          label="Resueltas"
          value={analytics.totals.resolved}
          hint="Resuelto o cerrado"
        />
        <Kpi label="Anuladas" value={analytics.totals.cancelled} />
        <Kpi
          label="Aún abiertas"
          value={analytics.totals.active}
          hint="De las creadas en el periodo"
        />
        <Kpi label="Sin asignar" value={analytics.totals.unassignedCreated} />
        <Kpi
          label="Media / día"
          value={analytics.totals.avgPerDay}
          hint="Incidencias creadas"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="font-heading text-lg font-semibold text-slate-900">
              Evolución
            </h2>
            <p className="text-sm text-slate-500">
              Creadas vs resueltas por {granularity === "day" ? "día" : granularity === "week" ? "semana" : "mes"}
            </p>
          </div>
          <SeriesChart series={analytics.series} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="font-heading text-lg font-semibold text-slate-900">
              Estado actual (creadas)
            </h2>
            <p className="text-sm text-slate-500">
              Cómo están ahora las incidencias del periodo
            </p>
          </div>
          <ul className="space-y-3">
            {analytics.byStatus.map((row) => (
              <li
                key={row.status}
                className="flex items-center justify-between gap-3"
              >
                <StatusBadge status={row.status} />
                <span className="font-heading text-lg font-semibold tabular-nums text-slate-900">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-heading text-lg font-semibold text-slate-900">
              Por agente
            </h2>
            <p className="text-sm text-slate-500">
              Asignadas creadas en el periodo, resueltas en el periodo y carga activa
            </p>
          </div>
          <Link
            href="/tickets"
            className="text-sm font-medium text-teal-700 hover:text-teal-800"
          >
            Ir a tickets
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-3 font-medium">Agente</th>
                <th className="pb-2 pr-3 font-medium tabular-nums">Asignadas</th>
                <th className="pb-2 pr-3 font-medium tabular-nums">Resueltas</th>
                <th className="pb-2 font-medium tabular-nums">Activas ahora</th>
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
        <p className="mt-3 text-xs text-slate-500">
          «Resueltas» cuenta tickets en estado Resuelto o Cerrado cuya última
          actualización cae en el periodo (aproximación mientras no haya fecha
          de resolución dedicada).
        </p>
      </section>
    </div>
  );
}
