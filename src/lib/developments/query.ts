import { appendPeriodSearchParams, type PeriodPreset } from "@/lib/analytics/period";
import type { AssignmentFilter, StatusFilter } from "@/types/database";

export type DesarrollosQuery = {
  status?: StatusFilter;
  assignment?: AssignmentFilter;
  periodo?: PeriodPreset | "all";
  desde?: string;
  hasta?: string;
};

/** Build /desarrollos?… keeping status, assignment and period in sync with Reportes. */
export function buildDesarrollosHref(q: DesarrollosQuery): string {
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
  return s ? `/desarrollos?${s}` : "/desarrollos";
}
