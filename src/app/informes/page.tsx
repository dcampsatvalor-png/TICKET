import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ReportsView } from "@/components/analytics/reports-view";
import { getTicketAnalytics } from "@/lib/analytics/service";
import {
  madridDateKey,
  parseGranularity,
  resolveDateRange,
} from "@/lib/analytics/period";
import { getCurrentProfile } from "@/lib/tickets/service";
import { isDemoMode } from "@/lib/env";

export default async function InformesPage({
  searchParams,
}: {
  searchParams: Promise<{
    periodo?: string;
    agrupar?: string;
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
  const granularity = parseGranularity(params.agrupar);
  const analytics = await getTicketAnalytics(range, granularity);

  return (
    <div className="min-h-screen">
      <AppHeader profile={profile} active="informes" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-900">
            Informes
          </h1>
          <p className="max-w-2xl text-slate-600">
            Vista simple de volumen de incidencias, ritmo diario y resolución por
            agente.
          </p>
        </div>

        <ReportsView
          analytics={analytics}
          preset={range.preset}
          granularity={granularity}
          from={madridDateKey(range.from)}
          to={madridDateKey(range.to)}
        />
      </main>
    </div>
  );
}
