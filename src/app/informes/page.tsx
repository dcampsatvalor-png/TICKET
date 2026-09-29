import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ReportsView } from "@/components/analytics/reports-view";
import {
  getDevelopmentAnalytics,
  getTicketAnalytics,
} from "@/lib/analytics/service";
import {
  madridDateKey,
  resolveDateRange,
} from "@/lib/analytics/period";
import { getCurrentProfile } from "@/lib/tickets/service";
import { isDemoMode } from "@/lib/env";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{
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
  const range = resolveDateRange({
    preset: params.periodo,
    from: params.desde,
    to: params.hasta,
  });
  const [tickets, developments] = await Promise.all([
    getTicketAnalytics(range, "day"),
    getDevelopmentAnalytics(range, "day"),
  ]);

  return (
    <div className="min-h-screen">
      <AppHeader profile={profile} active="informes" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-900">
            Reportes
          </h1>
          <p className="max-w-2xl text-slate-600">
            Volumen y estado actual de <span className="font-medium">incidencias</span>{" "}
            y <span className="font-medium">desarrollos</span> creados en el periodo,
            por estado y por agente.
          </p>
        </div>

        <ReportsView
          tickets={tickets}
          developments={developments}
          preset={range.preset}
          from={madridDateKey(range.from)}
          to={madridDateKey(range.to)}
        />
      </main>
    </div>
  );
}
