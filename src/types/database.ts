export type TicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed"
  | "cancelled";

/** Roles de acceso al panel (no confundir con estados de ticket). */
export type AppRole = "admin" | "employee";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  created_at: string;
};

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  employee: "Empleado",
};

export type Ticket = {
  id: string;
  ticket_number: number;
  subject: string;
  description: string;
  sender_email: string;
  sender_name: string | null;
  status: TicketStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  last_email_message_id?: string | null;
  email_references?: string | null;
  email_thread_index?: string | null;
  email_thread_topic?: string | null;
};

export type TicketComment = {
  id: string;
  ticket_id: string;
  author_id: string | null;
  is_internal: boolean;
  content: string;
  created_at: string;
};

export type TicketWithRelations = Ticket & {
  assignee: Profile | null;
  comments: (TicketComment & { author: Profile | null })[];
};

export type TicketListItem = Ticket & {
  assignee: Profile | null;
};

export type AssignmentFilter = "mine" | "unassigned" | "all";
/** Single status, all, or composites used by Informes KPIs */
export type StatusFilter =
  | TicketStatus
  | "all"
  | "active"
  | "done";

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Abierto",
  in_progress: "En proceso",
  resolved: "Resuelto",
  closed: "Cerrado",
  cancelled: "Anulado",
};

export function ticketMatchesStatusFilter(
  status: TicketStatus,
  filter: StatusFilter
): boolean {
  // "Todos" oculta anuladas; solo el filtro Anulado las muestra.
  if (filter === "all") return status !== "cancelled";
  if (filter === "active") return status === "open" || status === "in_progress";
  if (filter === "done") return status === "resolved" || status === "closed";
  return status === filter;
}

export type DevelopmentRequest = {
  id: string;
  request_number: number;
  subject: string;
  description: string;
  sender_email: string;
  sender_name: string | null;
  status: TicketStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  last_email_message_id?: string | null;
  email_references?: string | null;
  email_thread_index?: string | null;
  email_thread_topic?: string | null;
};

export type DevelopmentRequestComment = {
  id: string;
  request_id: string;
  author_id: string | null;
  is_internal: boolean;
  content: string;
  created_at: string;
};

export type DevelopmentRequestListItem = DevelopmentRequest & {
  assignee: Profile | null;
};

export type DevelopmentRequestWithRelations = DevelopmentRequest & {
  assignee: Profile | null;
  comments: (DevelopmentRequestComment & { author: Profile | null })[];
};
