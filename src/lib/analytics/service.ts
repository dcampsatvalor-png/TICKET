import { isDemoMode } from "@/lib/env";
import {
  listAllDemoTicketsWithAssignee,
  getDemoAgents,
} from "@/lib/demo/store";
import {
  formatRangeLabel,
  type BucketGranularity,
  type DateRange,
} from "@/lib/analytics/period";
import { createClient } from "@/lib/supabase/server";
import type { Profile, TicketListItem, TicketStatus } from "@/types/database";
import { STATUS_LABELS } from "@/types/database";

const RESOLVED_STATUSES: TicketStatus[] = ["resolved", "closed"];
const ACTIVE_STATUSES: TicketStatus[] = ["open", "in_progress"];

export type AgentAnalyticsRow = {
  agentId: string | null;
  agentName: string;
  assignedCreated: number;
  resolved: number;
  active: number;
};

export type TicketAnalytics = {
  rangeLabel: string;
  totals: {
    created: number;
    unassignedCreated: number;
    avgPerDay: number;
  };
  byStatus: { status: TicketStatus; label: string; count: number }[];
  byAgent: AgentAnalyticsRow[];
};

function inRange(iso: string, from: Date, to: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t <= to.getTime();
}

function isResolvedStatus(status: TicketStatus): boolean {
  return RESOLVED_STATUSES.includes(status);
}

function buildAnalytics(
  tickets: TicketListItem[],
  agents: Profile[],
  range: DateRange
): TicketAnalytics {
  const createdInRange = tickets.filter((t) =>
    inRange(t.created_at, range.from, range.to)
  );

  const statusCounts = new Map<TicketStatus, number>();
  for (const t of createdInRange) {
    statusCounts.set(t.status, (statusCounts.get(t.status) ?? 0) + 1);
  }

  const daySpan = Math.max(
    1,
    Math.round((range.to.getTime() - range.from.getTime()) / 86400000) + 1
  );

  const agentMap = new Map<string | null, AgentAnalyticsRow>();
  agentMap.set(null, {
    agentId: null,
    agentName: "Sin asignar",
    assignedCreated: 0,
    resolved: 0,
    active: 0,
  });
  for (const agent of agents) {
    agentMap.set(agent.id, {
      agentId: agent.id,
      agentName: agent.full_name,
      assignedCreated: 0,
      resolved: 0,
      active: 0,
    });
  }

  for (const t of createdInRange) {
    // Cancelled + unassigned should not inflate the "Sin asignar" bucket
    if (!t.assigned_to && t.status === "cancelled") continue;

    const id = t.assigned_to;
    const row =
      agentMap.get(id) ??
      ({
        agentId: id,
        agentName: t.assignee?.full_name ?? "Agente",
        assignedCreated: 0,
        resolved: 0,
        active: 0,
      } satisfies AgentAnalyticsRow);
    row.assignedCreated += 1;
    if (isResolvedStatus(t.status)) row.resolved += 1;
    if (ACTIVE_STATUSES.includes(t.status)) row.active += 1;
    agentMap.set(id, row);
  }

  const byAgent = [...agentMap.values()]
    .filter(
      (r) =>
        r.assignedCreated > 0 || r.resolved > 0 || r.active > 0 || r.agentId !== null
    )
    .sort((a, b) => b.resolved - a.resolved || b.assignedCreated - a.assignedCreated);

  return {
    rangeLabel: formatRangeLabel(range.from, range.to),
    totals: {
      created: createdInRange.length,
      unassignedCreated: createdInRange.filter(
        (t) => !t.assigned_to && t.status !== "cancelled"
      ).length,
      avgPerDay: Math.round((createdInRange.length / daySpan) * 10) / 10,
    },
    byStatus: (
      ["open", "in_progress", "resolved", "closed", "cancelled"] as TicketStatus[]
    ).map((status) => ({
      status,
      label: STATUS_LABELS[status],
      count: statusCounts.get(status) ?? 0,
    })),
    byAgent,
  };
}

async function listTicketsForAnalytics(): Promise<{
  tickets: TicketListItem[];
  agents: Profile[];
}> {
  if (isDemoMode()) {
    return {
      tickets: listAllDemoTicketsWithAssignee(),
      agents: getDemoAgents(),
    };
  }

  const supabase = await createClient();
  const [ticketsRes, agentsRes] = await Promise.all([
    supabase
      .from("tickets")
      .select("*, assignee:profiles!tickets_assigned_to_fkey(*)")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").order("full_name"),
  ]);

  if (ticketsRes.error) throw ticketsRes.error;
  if (agentsRes.error) throw agentsRes.error;

  return {
    tickets: (ticketsRes.data ?? []) as TicketListItem[],
    agents: (agentsRes.data ?? []) as Profile[],
  };
}

export async function getTicketAnalytics(
  range: DateRange,
  _granularity: BucketGranularity = "day"
): Promise<TicketAnalytics> {
  const { tickets, agents } = await listTicketsForAnalytics();
  return buildAnalytics(tickets, agents, range);
}
