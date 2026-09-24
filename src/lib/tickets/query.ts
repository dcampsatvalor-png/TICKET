import { appendPeriodSearchParams, type PeriodPreset } from "@/lib/analytics/period";
import type { AssignmentFilter, StatusFilter } from "@/types/database";

export type TicketsQuery = {
  status?: StatusFilter;
  assignment?: AssignmentFilter;
  periodo?: PeriodPreset | "all";
  desde?: string;
  hasta?: string;
};

/** Build /tickets?… keeping status, assignment and period in sync with Informes. */
export function buildTicketsHref(q: TicketsQuery): string {
  const params = new URLSearchParams();
  if (q.status && q.status !== "all") params.set("status", q.status);
  if (q.assignment && q.assignment !== "all") {
    params.set("assignment", q.assignment);
  }
  appendPeriodSearchParams(params, {
    preset: q.periodo ?? "all",
    from: q.desde,
    to: q.hasta,
  });
  const s = params.toString();
  return s ? `/tickets?${s}` : "/tickets";
}
