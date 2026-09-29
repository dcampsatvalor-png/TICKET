import type {
  AssignmentFilter,
  DevelopmentRequest,
  DevelopmentRequestComment,
  DevelopmentRequestListItem,
  DevelopmentRequestWithRelations,
  StatusFilter,
  TicketStatus,
} from "@/types/database";
import { ticketMatchesStatusFilter } from "@/types/database";
import { getDemoAgents } from "@/lib/demo/store";

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

type DevStore = {
  requests: DevelopmentRequest[];
  comments: DevelopmentRequestComment[];
  nextNumber: number;
};

declare global {
  var __developmentDemoStore: DevStore | undefined;
}

function seed(): DevStore {
  const requests: DevelopmentRequest[] = [
    {
      id: "dev-req-1",
      request_number: 2001,
      subject: "Integración API con nuevo CRM",
      description:
        "Necesitamos conectar el CRM interno con el módulo de valoraciones para sincronizar contactos.",
      sender_email: "producto@tasacioneshipotecarias.com",
      sender_name: "Equipo Producto",
      status: "open",
      assigned_to: null,
      created_at: hoursAgo(12),
      updated_at: hoursAgo(12),
    },
    {
      id: "dev-req-2",
      request_number: 2002,
      subject: "Informe Power BI de tickets por área",
      description: "Dashboard con métricas de SLA y volumen por departamento.",
      sender_email: "direccion@tasacioneshipotecarias.com",
      sender_name: "Dirección",
      status: "in_progress",
      assigned_to: "demo-agent-2",
      created_at: hoursAgo(48),
      updated_at: hoursAgo(6),
    },
  ];
  return { requests, comments: [], nextNumber: 2003 };
}

function getStore(): DevStore {
  if (!globalThis.__developmentDemoStore) {
    globalThis.__developmentDemoStore = seed();
  }
  return globalThis.__developmentDemoStore;
}

export function listAllDemoDevelopmentsWithAssignee(): DevelopmentRequestListItem[] {
  const agents = getDemoAgents();
  return getStore().requests.map((r) => ({
    ...r,
    assignee: agents.find((p) => p.id === r.assigned_to) ?? null,
  }));
}

export function listDemoDevelopmentRequests(filters: {
  status: StatusFilter;
  assignment?: AssignmentFilter;
  currentUserId: string;
  createdFrom?: Date | null;
  createdTo?: Date | null;
}): DevelopmentRequestListItem[] {
  const store = getStore();
  const agents = getDemoAgents();
  const assignment = filters.assignment ?? "all";
  return store.requests
    .filter((r) => ticketMatchesStatusFilter(r.status, filters.status))
    .filter((r) => {
      if (assignment === "mine") return r.assigned_to === filters.currentUserId;
      if (assignment === "unassigned") {
        return !r.assigned_to && r.status !== "cancelled";
      }
      return true;
    })
    .filter((r) => {
      if (filters.createdFrom && new Date(r.created_at) < filters.createdFrom) {
        return false;
      }
      if (filters.createdTo && new Date(r.created_at) > filters.createdTo) {
        return false;
      }
      return true;
    })
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
    .map((r) => ({
      ...r,
      assignee: agents.find((p) => p.id === r.assigned_to) ?? null,
    }));
}

export function getDemoDevelopmentRequest(
  id: string
): DevelopmentRequestWithRelations | null {
  const store = getStore();
  const req = store.requests.find((r) => r.id === id);
  if (!req) return null;
  const agents = getDemoAgents();
  return {
    ...req,
    assignee: agents.find((p) => p.id === req.assigned_to) ?? null,
    comments: store.comments
      .filter((c) => c.request_id === id)
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
      .map((c) => ({
        ...c,
        author: agents.find((p) => p.id === c.author_id) ?? null,
      })),
  };
}

export function findDemoDevelopmentByNumber(n: number): DevelopmentRequest | null {
  return getStore().requests.find((r) => r.request_number === n) ?? null;
}

export function listOpenDemoDevelopmentsBySender(email: string): DevelopmentRequest[] {
  const normalized = email.trim().toLowerCase();
  return getStore().requests.filter(
    (r) =>
      r.sender_email.toLowerCase() === normalized &&
      (r.status === "open" || r.status === "in_progress")
  );
}

export function createDemoDevelopmentRequest(input: {
  subject: string;
  description: string;
  senderEmail: string;
  senderName: string | null;
  messageId?: string | null;
}): DevelopmentRequest {
  const store = getStore();
  const req: DevelopmentRequest = {
    id: `dev-req-${store.nextNumber}`,
    request_number: store.nextNumber,
    subject: input.subject,
    description: input.description,
    sender_email: input.senderEmail,
    sender_name: input.senderName,
    status: "open",
    assigned_to: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_email_message_id: input.messageId ?? null,
    email_references: input.messageId ?? null,
  };
  store.nextNumber += 1;
  store.requests.push(req);
  return req;
}

export function addDemoDevelopmentComment(input: {
  requestId: string;
  authorId: string | null;
  content: string;
  isInternal: boolean;
}): void {
  const store = getStore();
  store.comments.push({
    id: `dev-comment-${Date.now()}`,
    request_id: input.requestId,
    author_id: input.authorId,
    is_internal: input.isInternal,
    content: input.content,
    created_at: new Date().toISOString(),
  });
  const req = store.requests.find((r) => r.id === input.requestId);
  if (req) req.updated_at = new Date().toISOString();
}

export function updateDemoDevelopmentStatus(
  id: string,
  status: TicketStatus
): void {
  const req = getStore().requests.find((r) => r.id === id);
  if (req) {
    req.status = status;
    req.updated_at = new Date().toISOString();
  }
}

export function updateDemoDevelopmentAssignee(
  id: string,
  assignedTo: string | null
): void {
  const req = getStore().requests.find((r) => r.id === id);
  if (req) {
    req.assigned_to = assignedTo;
    req.updated_at = new Date().toISOString();
  }
}

export function updateDemoDevelopmentEmailThread(
  id: string,
  messageId: string | null | undefined,
  previousReferences?: string | null,
  threadIndex?: string | null
): void {
  const req = getStore().requests.find((r) => r.id === id);
  if (!req) return;
  if (messageId) {
    const parts = (previousReferences ?? req.email_references ?? "")
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.includes(messageId)) parts.push(messageId);
    req.last_email_message_id = messageId;
    req.email_references = parts.join(" ");
  }
  if (threadIndex) req.email_thread_index = threadIndex;
  req.updated_at = new Date().toISOString();
}
