import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { DevelopmentDetail } from "@/components/developments/development-detail";
import { LiveRefresh } from "@/components/live-refresh";
import { isDemoMode } from "@/lib/env";
import {
  getCurrentProfile,
  getDevelopmentRequest,
  listAgents,
} from "@/lib/developments/service";

export default async function DevelopmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile && !isDemoMode()) {
    redirect("/login");
  }

  const { id } = await params;
  const [request, agents] = await Promise.all([
    getDevelopmentRequest(id),
    listAgents(),
  ]);

  if (!request) notFound();

  return (
    <div className="min-h-screen">
      <AppHeader profile={profile} active="desarrollos" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex justify-end">
          <LiveRefresh
            realtime={!isDemoMode()}
            extraTables={[
              "development_requests",
              "development_request_comments",
            ]}
          />
        </div>
        <DevelopmentDetail request={request} agents={agents} />
      </main>
    </div>
  );
}
