import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import {
  DevelopmentFilters,
  DevelopmentList,
} from "@/components/developments/development-list";
import { LiveRefresh } from "@/components/live-refresh";
import {
  getCurrentProfile,
  listDevelopmentRequests,
} from "@/lib/developments/service";
import { isDemoMode } from "@/lib/env";
import type { StatusFilter } from "@/types/database";
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

export default async function DesarrollosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile && !isDemoMode()) {
    redirect("/login");
  }

  const params = await searchParams;
  const status = parseStatus(params.status);
  const requests = await listDevelopmentRequests({ status });

  return (
    <div className="min-h-screen">
      <AppHeader profile={profile} active="desarrollos" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-900">
              Desarrollos
            </h1>
            <p className="max-w-xl text-slate-600">
              Peticiones de nuevas funcionalidades recibidas en{" "}
              <span className="font-medium text-slate-800">
                desarrollos@tasacioneshipotecarias.com
              </span>
              . Separadas de las incidencias de soporte IT.
            </p>
          </div>
          <LiveRefresh
            realtime={!isDemoMode()}
            extraTables={[
              "development_requests",
              "development_request_comments",
            ]}
          />
        </div>

        <div className="mb-6">
          <Suspense fallback={null}>
            <DevelopmentFilters status={status} />
          </Suspense>
        </div>

        <Suspense
          fallback={
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
              Cargando peticiones…
            </div>
          }
        >
          <DevelopmentList requests={requests} />
        </Suspense>
      </main>
    </div>
  );
}
