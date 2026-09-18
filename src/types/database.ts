export type TicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed"
  | "cancelled";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
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
export type StatusFilter = TicketStatus | "all";

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Abierto",
  in_progress: "En proceso",
  resolved: "Resuelto",
  closed: "Cerrado",
  cancelled: "Anulado",
};
