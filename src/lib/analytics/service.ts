import { isDemoMode } from "@/lib/env";
import {
  listAllDemoTicketsWithAssignee,
  getDemoAgents,
} from "@/lib/demo/store";
import {
  bucketKey,
  enumerateBuckets,
  formatBucketLabel,
  formatRangeLabel,
  type BucketGranularity,
  type DateRange,
} from "@/lib/analytics/period";
import { createClient } from "@/lib/supabase/server";
import type { Profile, TicketListItem, TicketStatus } from "@/types/database";
import { STATUS_LABELS } from "@/types/database";

const RESOLVED_STATUSES: TicketStatus[] = ["resolved", "closed"];
const ACTIVE_STATUSES: TicketStatus[] = ["open", "in_progress"];

export type AnalyticsBucket = {
  key: string;
  label: string;
  created: number;
  resolved: number;
};

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
    resolved: number;
    cancelled: number;
    active: number;
    unassignedCreated: number;
    avgPerDay: number;
  };
  byStatus: { status: TicketStatus; label: string; count: number }[];
  series: AnalyticsBucket[];
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
  range: DateRange,
  granularity: BucketGranularity
): TicketAnalytics {
  const createdInRange = tickets.filter((t) =>
    inRange(t.created_at, range.from, range.to)
  );
  const resolvedInRange = tickets.filter(
    (t) =>
      isResolvedStatus(t.status) && inRange(t.updated_at, range.from, range.to)
  );
  const cancelledInRange = tickets.filter(
    (t) =>
      t.status === "cancelled" && inRange(t.updated_at, range.from, range.to)
  );

  const statusCounts = new Map<TicketStatus, number>();
  for (const t of createdInRange) {
    statusCounts.set(t.status, (statusCounts.get(t.status) ?? 0) + 1);
  }

  const keys = enumerateBuckets(range.from, range.to, granularity);
  const createdByBucket = new Map<string, number>();
  const resolvedByBucket = new Map<string, number>();
  for (const key of keys) {
    createdByBucket.set(key, 0);
    resolvedByBucket.set(key, 0);
  }
  for (const t of createdInRange) {
    const key = bucketKey(t.created_at, granularity);
    if (createdByBucket.has(key)) {
      createdByBucket.set(key, (createdByBucket.get(key) ?? 0) + 1);
    }
  }
  for (const t of resolvedInRange) {
    const key = bucketKey(t.updated_at, granularity);
    if (resolvedByBucket.has(key)) {
      resolvedByBucket.set(key, (resolvedByBucket.get(key) ?? 0) + 1);
    }
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
    agentMap.set(id, row);
  }

  for (const t of resolvedInRange) {
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
    row.resolved += 1;
    agentMap.set(id, row);
  }

  for (const t of tickets) {
    if (!ACTIVE_STATUSES.includes(t.status)) continue;
    const id = t.assigned_to;
    const row = agentMap.get(id);
    if (row) row.active += 1;
  }

  const byAgent = [...agentMap.values()]
    .filter(
      (r) => r.assignedCreated > 0 || r.resolved > 0 || r.active > 0 || r.agentId !== null
    )
    .sort((a, b) => b.resolved - a.resolved || b.assignedCreated - a.assignedCreated);

  const activeCreated = createdInRange.filter((t) =>
    ACTIVE_STATUSES.includes(t.status)
  ).length;

  return {
    rangeLabel: formatRangeLabel(range.from, range.to),
    totals: {
      created: createdInRange.length,
      resolved: resolvedInRange.length,
      cancelled: cancelledInRange.length,
      active: activeCreated,
      unassignedCreated: createdInRange.filter((t) => !t.assigned_to).length,
      avgPerDay: Math.round((createdInRange.length / daySpan) * 10) / 10,
    },
    byStatus: (
      ["open", "in_progress", "resolved", "closed", "cancelled"] as TicketStatus[]
    ).map((status) => ({
      status,
      label: STATUS_LABELS[status],
      count: statusCounts.get(status) ?? 0,
    })),
    series: keys.map((key) => ({
      key,
      label: formatBucketLabel(key, granularity),
      created: createdByBucket.get(key) ?? 0,
      resolved: resolvedByBucket.get(key) ?? 0,
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
  granularity: BucketGranularity
): Promise<TicketAnalytics> {
  const { tickets, agents } = await listTicketsForAnalytics();
  return buildAnalytics(tickets, agents, range, granularity);
}
