import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { TicketDetail } from "@/components/tickets/ticket-detail";
import { LiveRefresh } from "@/components/live-refresh";
import { isDemoMode } from "@/lib/env";
import { getCurrentProfile, getTicket, listAgents } from "@/lib/tickets/service";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile && !isDemoMode()) {
    redirect("/login");
  }

  const { id } = await params;
  const [ticket, agents] = await Promise.all([getTicket(id), listAgents()]);

  if (!ticket) notFound();

  return (
    <div className="min-h-screen">
      <AppHeader profile={profile} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex justify-end">
          <LiveRefresh realtime={!isDemoMode()} />
        </div>
        <TicketDetail ticket={ticket} agents={agents} />
      </main>
    </div>
  );
}
